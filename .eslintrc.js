module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "airbnb-base",
        "plugin:prettier/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "@typescript-eslint"
    ],
    "rules": {
        "import/prefer-default-export": "off",
        "no-unused-vars": "off",
        "import/extensions": "off",
        "import/no-unresolved": "off",
        "no-use-before-define": ["error", {
            "functions": false,
            "classes": false,
            "variables": true,
            "allowNamedExports": true
        }],
        "no-console": ["warn", { "allow": ["info", "warn", "error"] }],
        "no-new": "off",
    }
}
