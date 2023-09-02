import * as cdk from 'aws-cdk-lib';
import { SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { DockerImageAsset, Platform } from 'aws-cdk-lib/aws-ecr-assets';
import {
  Cluster,
  ContainerImage,
  CpuArchitecture,
  FargatePlatformVersion,
  FargateTaskDefinition,
  LogDrivers,
  OperatingSystemFamily,
  Secret as EcsSecret,
} from 'aws-cdk-lib/aws-ecs';
import { ScheduledFargateTask } from 'aws-cdk-lib/aws-ecs-patterns';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { Bucket } from 'aws-cdk-lib/aws-s3';
import {
  Effect,
  ManagedPolicy,
  Policy,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from 'aws-cdk-lib/aws-iam';
import {
  EcsFargateLaunchTarget,
  EcsRunTask,
} from 'aws-cdk-lib/aws-stepfunctions-tasks';
import {
  IntegrationPattern,
  ServiceIntegrationPattern,
  StateMachine,
} from 'aws-cdk-lib/aws-stepfunctions';
import { SfnStateMachine } from 'aws-cdk-lib/aws-events-targets';

export class HoyoLoginStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'Vpc', {
      maxAzs: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });
    vpc.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const envConfig = dotenv.parse(
      readFileSync(path.join(__dirname, '..', '..', 'app', '.env.production'))
    );
    // Create the secrets
    const secrets: { [key: string]: EcsSecret } = {};

    Object.keys(envConfig).forEach((key, index) => {
      const value = cdk.SecretValue.unsafePlainText(envConfig[key]);
      const secretManager = new Secret(this, `Secret${index}`, {
        secretName: `hoyo-login${key}`,
        secretStringValue: value,
      });
      secrets[key] = EcsSecret.fromSecretsManager(secretManager);
      secretManager.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    });

    // S3
    const stateBucket = new Bucket(this, 'StateBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      versioned: true,
      bucketName: 'hoyo-login-state-bucket',
      blockPublicAccess: {
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      publicReadAccess: false,
    });
    stateBucket.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const ecsTaskRole = new Role(this, 'EcsTaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    ecsTaskRole.addToPolicy(
      new PolicyStatement({
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:PutObjectAcl',
          's3:ListBucket',
          's3:DeleteObject',
        ],
        effect: Effect.ALLOW,
        resources: [`${stateBucket.bucketArn}/*`],
      })
    );
    ecsTaskRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    // s3はタスクロール経由でアクセスする
    stateBucket.addToResourcePolicy(
      new PolicyStatement({
        actions: ['s3:*'],
        effect: Effect.ALLOW,
        principals: [ecsTaskRole],
        resources: [`${stateBucket.bucketArn}/*`],
      })
    );

    // ecs cluster
    const cluster = new Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'hoyo-login-cluster',
    });
    cluster.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const dockerAsset = new DockerImageAsset(this, 'DockerAsset', {
      // app directoryのパスを指定
      directory: path.join(__dirname, '..', '..', 'app'),
      file: 'Dockerfile',
      platform: Platform.LINUX_AMD64,
      buildArgs: {
        DOCKER_BUILDKIT: '1',
      },
    });

    // タスク実行ロールを作成
    const taskExecutionRole = new Role(this, 'TaskExecutionRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    taskExecutionRole.addToPolicy(
      new PolicyStatement({
        actions: ['logs:*', 'ssm:*', 'kms:*', 'secretsmanager:*', 'ecr:*'],
        effect: Effect.ALLOW,
        resources: ['*'],
      })
    );

    const taskDefinition = new FargateTaskDefinition(this, 'TaskDefinition', {
      taskRole: ecsTaskRole, // タスクロールを設定
      executionRole: taskExecutionRole,
      cpu: 1024,
      memoryLimitMiB: 2048,
      runtimePlatform: {
        cpuArchitecture: CpuArchitecture.X86_64,
        operatingSystemFamily: OperatingSystemFamily.LINUX,
      },
    });

    // Create a new log group
    const logGroup = new LogGroup(this, 'TaskDefinitionAppContainerLogGroup', {
      logGroupName: 'hoyo-login',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      retention: RetentionDays.ONE_YEAR,
    });

    const container = taskDefinition.addContainer('AppContainer', {
      image: ContainerImage.fromDockerImageAsset(dockerAsset),
      memoryLimitMiB: 1024,
      cpu: 256,
      environment: {
        BUCKET_NAME: stateBucket.bucketName,
      },
      secrets,
      logging: LogDrivers.awsLogs({
        streamPrefix: 'hoyo-login',
        logGroup,
        datetimeFormat: '%Y-%m-%d %H:%M:%S',
      }),
    });
    taskDefinition.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    const ecsRunTask = new EcsRunTask(this, 'EcsRunTask', {
      integrationPattern: IntegrationPattern.RUN_JOB,
      cluster,
      taskDefinition,
      launchTarget: new EcsFargateLaunchTarget(),
      subnets: {
        subnetType: SubnetType.PUBLIC,
      },
    });

    ecsRunTask.addRetry({
      maxAttempts: 3,
      interval: cdk.Duration.seconds(10),
      backoffRate: 2.0, // リトライ間隔の増加率
      errors: ['States.ALL'], // すべてのエラーでリトライを行います
    });

    // Step Functions の State Machine を定義
    const stateMachine = new StateMachine(this, 'StateMachine', {
      definition: ecsRunTask,
      timeout: cdk.Duration.hours(1),
    });

    // AWS EventBridge (CloudWatch Events) での定期実行の設定
    new Rule(this, 'ScheduleRule', {
      schedule: Schedule.cron({
        minute: '0',
        hour: '0',
      }),
      targets: [new SfnStateMachine(stateMachine)],
    });
  }
}
