export default {
    "commands": {
        "@suggestion": "command",
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
                "#": {
                    "class": {
                        "(": {
                            "!className": {
                                ")": {
                                    ",": {
                                        "#": "commands.do.#"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    "className": {
        "$KWD": {
            ".": "className"
        }
    },
    "var": {
        "^": {
            "@suggestion": "global",
            "$KWD": "var.$KWD"
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