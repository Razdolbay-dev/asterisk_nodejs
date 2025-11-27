const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');


const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Asterisk GUI API',
            version: '1.0.0',
            description: 'REST API for Asterisk PBX Management',
            contact: {
                name: 'API Support',
                email: 'support@asterisk-gui.local'
            },
            license: {
                name: 'MIT',
                url: 'https://spdx.org/licenses/MIT.html'
            }
        },
        servers: [
            {
                url: 'http://0.0.0.0:3000',
                description: 'Development server'
            },
            {
                url: 'http://192.168.88.182:3000',
                description: 'Production server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'integer',
                            example: 1
                        },
                        username: {
                            type: 'string',
                            example: 'admin'
                        },
                        role: {
                            type: 'string',
                            enum: ['admin', 'operator', 'viewer'],
                            example: 'admin'
                        },
                        email: {
                            type: 'string',
                            example: 'admin@asterisk.local'
                        }
                    }
                },
                SIPAccount: {
                    type: 'object',
                    required: ['id', 'password'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'SIP account ID',
                            example: '1001'
                        },
                        password: {
                            type: 'string',
                            description: 'SIP account password',
                            example: 'secret123'
                        },
                        context: {
                            type: 'string',
                            default: 'internal',
                            example: 'internal'
                        },
                        codecs: {
                            type: 'string',
                            default: 'ulaw,alaw',
                            example: 'ulaw,alaw,g729'
                        },
                        status: {
                            type: 'string',
                            enum: ['active', 'inactive'],
                            default: 'active',
                            example: 'active'
                        }
                    }
                },
                Queue: {
                    type: 'object',
                    required: ['id', 'name'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Queue ID',
                            example: 'support'
                        },
                        name: {
                            type: 'string',
                            description: 'Queue display name',
                            example: 'Support Queue'
                        },
                        strategy: {
                            type: 'string',
                            enum: ['ringall', 'rrmemory', 'leastrecent', 'fewestcalls', 'random', 'roundrobin'],
                            default: 'ringall',
                            example: 'ringall'
                        },
                        timeout: {
                            type: 'integer',
                            default: 30,
                            example: 30
                        },
                        wrapuptime: {
                            type: 'integer',
                            default: 10,
                            example: 10
                        },
                        maxlen: {
                            type: 'integer',
                            default: 0,
                            example: 20
                        },
                        servicelevel: {
                            type: 'integer',
                            default: 60,
                            example: 60
                        },
                        musicclass: {
                            type: 'string',
                            default: 'default',
                            example: 'default'
                        },
                        announce: {
                            type: 'string',
                            default: 'queue-thankyou',
                            example: 'queue-thankyou'
                        },
                        members: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    interface: {
                                        type: 'string',
                                        example: 'SIP/1001'
                                    },
                                    penalty: {
                                        type: 'integer',
                                        default: 0,
                                        example: 0
                                    },
                                    membername: {
                                        type: 'string',
                                        example: 'Agent 1001'
                                    }
                                }
                            }
                        }
                    }
                },
                Trunk: {
                    type: 'object',
                    required: ['id', 'name', 'host', 'username', 'password'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Trunk ID',
                            example: 'myprovider'
                        },
                        name: {
                            type: 'string',
                            description: 'Trunk display name',
                            example: 'My VoIP Provider'
                        },
                        host: {
                            type: 'string',
                            description: 'Provider host',
                            example: 'sip.voip-provider.com'
                        },
                        port: {
                            type: 'integer',
                            default: 5060,
                            example: 5060
                        },
                        username: {
                            type: 'string',
                            description: 'Authentication username',
                            example: 'myaccount'
                        },
                        password: {
                            type: 'string',
                            description: 'Authentication password',
                            example: 'mysecretpassword'
                        },
                        fromuser: {
                            type: 'string',
                            description: 'From user',
                            example: 'myaccount'
                        },
                        context: {
                            type: 'string',
                            default: 'from-trunk',
                            example: 'from-trunk'
                        },
                        qualify: {
                            type: 'string',
                            enum: ['yes', 'no'],
                            default: 'yes',
                            example: 'yes'
                        },
                        qualify_frequency: {
                            type: 'integer',
                            default: 60,
                            example: 60
                        },
                        register: {
                            type: 'string',
                            enum: ['yes', 'no'],
                            default: 'no',
                            example: 'yes'
                        },
                        protocol: {
                            type: 'string',
                            enum: ['udp', 'tcp', 'tls'],
                            default: 'udp',
                            example: 'udp'
                        }
                    }
                },
                Snapshot: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            example: 'b5995c38-039a-4f15-b345-61a1fd388a15'
                        },
                        comment: {
                            type: 'string',
                            example: 'Manual backup'
                        },
                        createdBy: {
                            type: 'string',
                            example: 'admin'
                        },
                        timestamp: {
                            type: 'string',
                            format: 'date-time',
                            example: '2025-11-25T11:33:43.950Z'
                        },
                        files: {
                            type: 'array',
                            items: {
                                type: 'string'
                            }
                        }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'string',
                            example: 'Error message'
                        }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./frontend/api/routes/*.js'] // путь к файлам с маршрутами
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
    swaggerSpec,
    swaggerUi
};