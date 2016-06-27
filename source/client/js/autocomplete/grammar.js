export default {
    "commands": {
        "@suggestion": "command",
        "@suggest": "*",
        "s": "commands.set",
        "set": {
            "$KWD": {
                "=": {
                    "!exp": {
                        ",": { "$KWD": "commands.set.$KWD" }
                    }
                }
            },
            ":": {
                "!exp": {
                    "$KWD": "commands.set.$KWD"
                }
            }
        },
        "w": "commands.write",
        "write": {
            "!exp": {
                ",": "commands.write"
            },
            "!": "commands.write.!exp"
        },
        "d": "commands.do",
        "do": {
            ":": {
                "!exp": {
                    "{": "commands.do.{",
                    "#": "commands.do.#"
                }
            },
            "{": {
                "}": {
                    "while": { "!exp": "commands" }
                },
                "!commands": "commands.do.{"
            },
            "#": {
                "@suggest": "#class(",
                "#": {
                    "@suggest": "*",
                    "class": {
                        "(": {
                            "@suggestion": "className",
                            "$KWD": {
                                "@suggestion": "className",
                                ")": {
                                    ".": {
                                        "@suggestion": "classMember",
                                        "$KWD": {
                                            "(": {
                                                "!exp": {
                                                    ",": "commands.do.#.#.class.(.$KWD.)...$KWD.(",
                                                    ")": {
                                                        ",": "commands.do"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "k": "commands.kill",
        "kill": {
            ":": {
                "!exp": {
                    "$KWD": "commands.set.$KWD"
                }
            },
            "$KWD": "commands"
        },
        "zwrite": "commands.write",
        "zw": "commands.write"
    },
    "var": {
        "^": {
            "@suggestion": "global",
            "$KWD": {
                "@suggestion": "global",
                "": "var.$KWD"
            }
        },
        "@": "var",
        "$KWD": {
            "@suggestion": "var",
            "(": {
                "!exp": {
                    ",": "var.$KWD.(",
                    ")": "!"
                }
            }
        }
    },
    "exp": {
        "(": {
            "!exp": {
                ")": "exp.$VAL"
            }
        },
        "'": {
            "=": "exp",
            "": "exp"
        },
        "!var": "exp.$VAL",
        "#": {
            "@suggest": "#class(",
            "#": {
                "@suggest": "*",
                "class": {
                    "(": {
                        "@suggestion": "className",
                        "$KWD": {
                            ")": {
                                ".": {
                                    "#": "commands.do.#"
                                }
                            }
                        }
                    }
                }
            }
        },
        "$VAL": {
            "+": "exp",
            "-": "exp",
            "*": "exp",
            "/": "exp",
            "[": "exp",
            "_": "exp",
            "=": "exp",
            ">": {
                "=": "exp",
                "": "exp"
            },
            "<": {
                "=": "exp",
                "": "exp"
            }
        }
    }
};