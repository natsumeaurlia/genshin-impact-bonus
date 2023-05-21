import { Template } from 'aws-cdk-lib/assertions';
import { HoyoLoginStack } from '../lib/hoyo-login-stack';
import * as cdk from 'aws-cdk-lib';

test('VPC Created', () => {
  const app = new cdk.App();
  const stack = new HoyoLoginStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResource('AWS::EC2::VPC', 1);
});

test('S3 Bucket Created', () => {
  const app = new cdk.App();
  const stack = new HoyoLoginStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'hoyo-login-state-bucket',
  });
});

test('ECS Cluster Created', () => {
  const app = new cdk.App();
  const stack = new HoyoLoginStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::ECS::Cluster', {
    ClusterName: 'hoyo-login-cluster',
  });
});

test('Scheduled Fargate Task Created', () => {
  const app = new cdk.App();
  const stack = new HoyoLoginStack(app, 'MyTestStack');
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::Events::Rule', {
    ScheduleExpression: 'cron(0 0 * * ? *)',
  });
});
