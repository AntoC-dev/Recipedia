/**
 * Commitlint configuration for Recipedia React Native project
 *
 * Enforces conventional commit format for consistent commit messages
 * and automatic changelog generation.
 */

module.exports = {
    extends: ['@commitlint/config-conventional'],

    rules: {
        // Type requirements
        'type-enum': [
            2,
            'always',
            [
                'feat',     // New feature
                'fix',      // Bug fix
                'docs',     // Documentation changes
                'style',    // Formatting, missing semi colons, etc
                'refactor', // Code change that neither fixes a bug nor adds a feature
                'perf',     // Performance improvements
                'test',     // Adding or modifying tests
                'chore',    // Maintenance tasks, dependency updates
                'ci',       // Changes to CI configuration files and scripts
                'build',    // Changes that affect the build system
                'revert',   // Reverts a previous commit
            ],
        ],

        // Subject requirements
        'subject-case': [0],
        'subject-empty': [2, 'never'],
        'subject-full-stop': [2, 'never', '.'],
        'subject-max-length': [2, 'always', 72],

        // Header requirements
        'header-max-length': [2, 'always', 100],

        // Body requirements
        'body-leading-blank': [1, 'always'],
        'body-max-line-length': [1, 'always', 100],

        // Footer requirements
        'footer-leading-blank': [1, 'always'],
        'footer-max-line-length': [2, 'always', 100],
    },
};
