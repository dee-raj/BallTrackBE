module.exports = {
    apps: [
        {
            name: "balltrack-BE",
            script: "dist/server.js",
            instances: 1,
            exec_mode: "fork",
            env: {
                NODE_ENV: "production"
            }
        }
    ]
};
