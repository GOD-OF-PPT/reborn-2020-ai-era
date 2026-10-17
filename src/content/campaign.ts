// Independent runtime working data; historical claims have limited source scope.
export const CAMPAIGN_CONTENT = {
  "version": "world-work-v3",
  "sources": [
    {
      "id": "H001",
      "url": "https://openai.com/index/openai-api/",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "2020-06-11 API公告和私有测试，不支持个体访问许可"
    },
    {
      "id": "H002",
      "url": "https://stability.ai/news-updates/stable-diffusion-public-release",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "正文8月22日；itemprop与JSON-LD datePublished为2022-08-22T18:06:20+0000；日期核验不等于许可核验"
    },
    {
      "id": "H003",
      "url": "https://openai.com/index/chatgpt/",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "2022-11-30研究预览，不等于同日API"
    },
    {
      "id": "H004",
      "url": "https://openai.com/index/gpt-4-research/",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "2023-03-14发布，API资格单独核验"
    },
    {
      "id": "H005",
      "url": "https://about.fb.com/news/2023/07/llama-2/",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "2023-07-18发布，许可/算力另行核验"
    },
    {
      "id": "H006",
      "url": "https://github.com/deepseek-ai/DeepSeek-V2",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "News列2024.05.06发布V2，不支持融资"
    },
    {
      "id": "H007",
      "url": "https://ir.kuaishou.com/zh-hans/news-releases/news-release-details/kuaishoukelingaixiangquanqiuyonghuquanmiankaifangneice",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "2024-07-25官方公告回顾6月6日起开放申请；6月10日官方原文为邀测；7月25日扩大全球网页内测，不能把申请当作已获资格"
    },
    {
      "id": "H008",
      "url": "https://api-docs.deepseek.com/zh-cn/updates/",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "2024-12-26 deepseek-chat升级V3"
    },
    {
      "id": "H009",
      "url": "https://api-docs.deepseek.com/zh-cn/updates/",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "2025-01-20 reasoner对应R1"
    },
    {
      "id": "H010",
      "url": "https://www.cac.gov.cn/2025-03/14/c_1743654684782215.htm",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "对外发布2025-03-14，文本署期03-07，施行09-01；只取时间事实"
    },
    {
      "id": "H011",
      "url": "https://www.cac.gov.cn/2023-07/13/c_1690898326795531.htm",
      "checkedAt": "2026-10-16",
      "status": "verified",
      "scope": "对外发布2023-07-13，施行08-15；不据此裁决现实业务合法性"
    }
  ],
  "anchors": [
    {
      "id": "H001",
      "classification": "historical",
      "title": "OpenAI宣布API私有测试",
      "sourceIds": [
        "H001"
      ],
      "actualDate": "2020-06-11",
      "publishedAt": "2020-06-11",
      "availableAt": "2020-06-11",
      "access": "private_beta",
      "enabled": true
    },
    {
      "id": "H002",
      "classification": "historical",
      "title": "Stable Diffusion公开发布",
      "sourceIds": [
        "H002"
      ],
      "actualDate": "2022-08-22",
      "publishedAt": "2022-08-22",
      "availableAt": "2022-08-22",
      "access": "conditional_release",
      "enabled": true
    },
    {
      "id": "H003",
      "classification": "historical",
      "title": "ChatGPT研究预览",
      "sourceIds": [
        "H003"
      ],
      "actualDate": "2022-11-30",
      "publishedAt": "2022-11-30",
      "availableAt": "2022-11-30",
      "access": "public_preview",
      "enabled": true
    },
    {
      "id": "H004",
      "classification": "historical",
      "title": "GPT-4发布",
      "sourceIds": [
        "H004"
      ],
      "actualDate": "2023-03-14",
      "publishedAt": "2023-03-14",
      "availableAt": "2023-03-14",
      "access": "conditional_release",
      "enabled": true
    },
    {
      "id": "H005",
      "classification": "historical",
      "title": "Llama 2发布",
      "sourceIds": [
        "H005"
      ],
      "actualDate": "2023-07-18",
      "publishedAt": "2023-07-18",
      "availableAt": "2023-07-18",
      "access": "conditional_release",
      "enabled": true
    },
    {
      "id": "H006",
      "classification": "historical",
      "title": "DeepSeek-V2发布",
      "sourceIds": [
        "H006"
      ],
      "actualDate": "2024-05-06",
      "publishedAt": "2024-05-06",
      "availableAt": "2024-05-06",
      "access": "conditional_release",
      "enabled": true
    },
    {
      "id": "H007",
      "classification": "historical",
      "title": "可灵AI推出",
      "sourceIds": [
        "H007"
      ],
      "actualDate": "2024-06-06",
      "publishedAt": "2024-06-06",
      "availableAt": "2024-06-06",
      "access": "conditional_release",
      "enabled": true
    },
    {
      "id": "H008",
      "classification": "historical",
      "title": "DeepSeek-V3模型更新",
      "sourceIds": [
        "H008"
      ],
      "actualDate": "2024-12-26",
      "publishedAt": "2024-12-26",
      "availableAt": "2024-12-26",
      "access": "conditional_release",
      "enabled": true
    },
    {
      "id": "H009",
      "classification": "historical",
      "title": "DeepSeek-R1模型节点",
      "sourceIds": [
        "H009"
      ],
      "actualDate": "2025-01-20",
      "publishedAt": "2025-01-20",
      "availableAt": "2025-01-20",
      "access": "conditional_release",
      "enabled": true
    },
    {
      "id": "H010",
      "classification": "historical",
      "title": "生成合成内容标识办法对外发布",
      "sourceIds": [
        "H010"
      ],
      "actualDate": "2025-03-14",
      "publishedAt": "2025-03-14",
      "availableAt": "2025-09-01",
      "access": "announcement",
      "enabled": true
    },
    {
      "id": "H011",
      "classification": "historical",
      "title": "生成式AI服务暂行办法对外发布",
      "sourceIds": [
        "H011"
      ],
      "actualDate": "2023-07-13",
      "publishedAt": "2023-07-13",
      "availableAt": "2023-08-15",
      "access": "announcement",
      "enabled": true
    }
  ],
  "capabilities": [
    {
      "id": "manual_editing",
      "anchorId": null,
      "availableAt": "2020-01-01",
      "entitlementIds": [],
      "classification": "fictional",
      "route": null
    },
    {
      "id": "spreadsheet",
      "anchorId": null,
      "availableAt": "2020-01-01",
      "entitlementIds": [],
      "classification": "fictional",
      "route": null
    },
    {
      "id": "gpt3_api",
      "anchorId": "H001",
      "availableAt": "2020-06-11",
      "entitlementIds": [
        "api_beta_access"
      ],
      "classification": "historical",
      "route": "api_relay"
    },
    {
      "id": "stable_diffusion_local",
      "anchorId": "H002",
      "availableAt": "2022-08-22",
      "entitlementIds": [
        "local_model_rights_and_hardware"
      ],
      "classification": "historical",
      "route": "ai_video"
    },
    {
      "id": "chatgpt_research",
      "anchorId": "H003",
      "availableAt": "2022-11-30",
      "entitlementIds": [
        "chatgpt_account_access"
      ],
      "classification": "historical",
      "route": "ai_course"
    },
    {
      "id": "gpt4_api",
      "anchorId": "H004",
      "availableAt": "2023-03-14",
      "entitlementIds": [
        "gpt4_api_access"
      ],
      "classification": "historical",
      "route": "api_relay"
    },
    {
      "id": "llama2_local",
      "anchorId": "H005",
      "availableAt": "2023-07-18",
      "entitlementIds": [
        "local_model_rights_and_hardware"
      ],
      "classification": "historical",
      "route": "api_relay"
    },
    {
      "id": "deepseek_v2",
      "anchorId": "H006",
      "availableAt": "2024-05-06",
      "entitlementIds": [
        "deepseek_supply_approval"
      ],
      "classification": "historical",
      "route": "deepseek_opportunity"
    },
    {
      "id": "kling_video",
      "anchorId": "H007",
      "availableAt": "2024-06-06",
      "entitlementIds": [
        "kling_access"
      ],
      "classification": "historical",
      "route": "ai_video"
    },
    {
      "id": "deepseek_v3",
      "anchorId": "H008",
      "availableAt": "2024-12-26",
      "entitlementIds": [
        "deepseek_supply_approval"
      ],
      "classification": "historical",
      "route": "deepseek_opportunity"
    },
    {
      "id": "deepseek_r1",
      "anchorId": "H009",
      "availableAt": "2025-01-20",
      "entitlementIds": [
        "deepseek_supply_approval"
      ],
      "classification": "historical",
      "route": "deepseek_opportunity"
    },
    {
      "id": "synthetic_label_rule",
      "anchorId": "H010",
      "availableAt": "2025-09-01",
      "entitlementIds": [],
      "classification": "historical",
      "route": null
    },
    {
      "id": "genai_service_rule",
      "anchorId": "H011",
      "availableAt": "2023-08-15",
      "entitlementIds": [],
      "classification": "historical",
      "route": null
    },
    {
      "id": "deepseek_counterfactual_equity",
      "anchorId": null,
      "availableAt": "2025-01-20",
      "entitlementIds": [
        "financing_consent",
        "equity_eligibility",
        "due_diligence"
      ],
      "classification": "counterfactual",
      "route": "deepseek_opportunity"
    },
    {
      "id": "basic_programming",
      "anchorId": null,
      "availableAt": "2020-01-01",
      "entitlementIds": [
        "basic_programming"
      ],
      "classification": "fictional",
      "route": null
    },
    {
      "id": "audience_research",
      "anchorId": null,
      "availableAt": "2020-01-01",
      "entitlementIds": [
        "audience_research"
      ],
      "classification": "fictional",
      "route": null
    },
    {
      "id": "api_announcement",
      "anchorId": "H001",
      "availableAt": "2020-06-11",
      "entitlementIds": [],
      "classification": "historical",
      "route": null
    },
    {
      "id": "chatgpt_announcement",
      "anchorId": "H003",
      "availableAt": "2022-11-30",
      "entitlementIds": [],
      "classification": "historical",
      "route": null
    },
    {"id":"deepseek_v2_announcement","anchorId":"H006","availableAt":"2024-05-06","entitlementIds":[],"classification":"historical","route":null},
    {
      "id": "deepseek_v3_announcement",
      "anchorId": "H008",
      "availableAt": "2024-12-26",
      "entitlementIds": [],
      "classification": "historical",
      "route": null
    }
  ],
  "entitlementIds": [
    "api_beta_access",
    "local_model_rights_and_hardware",
    "chatgpt_account_access",
    "gpt4_api_access",
    "kling_access",
    "deepseek_supply_approval",
    "financing_consent",
    "equity_eligibility",
    "due_diligence",
    "basic_programming",
    "audience_research"
  ],
  "preparationKeys": [
    "linzhou_pilot",
    "paid_manual_case",
    "manual_case",
    "customer_research",
    "api_application_materials",
    "teaching_outline",
    "ecosystem_materials"
  ],
  "events": [
    {
      "id": "PREP-CASE",
      "title": "整理手工练习案例",
      "classification": "fictional",
      "sourceIds": [],
      "effectiveWindow": {
        "from": "2020-01-22",
        "to": "2025-12-31"
      },
      "scope": {
        "binding": "player",
        "businessKind": null
      },
      "trigger": {
        "op": "all",
        "conditions": []
      },
      "priority": 10,
      "exclusiveGroup": null,
      "hiddenFactsPolicy": {
        "mode": "fixed_at_instance_creation",
        "domain": "opportunity"
      },
      "choices": [
        {
          "id": "prepare",
          "label": "投入时间整理准备材料",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 1,
          "costFen": 0,
          "effects": [
            {
              "op": "startJob",
              "durationDays": 7,
              "capacityUnits": 1,
              "onComplete": [
                {
                  "op": "recordPreparation",
                  "key": "manual_case"
                },
                {
                  "op": "recordCause",
                  "text": "练习材料完成；不代表客户验收、访问许可或经营收入"
                }
              ]
            }
          ]
        },
        {
          "id": "defer",
          "label": "暂不新增承诺",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 0,
          "costFen": 0,
          "effects": [
            {
              "op": "recordCause",
              "text": "保留现有义务，暂不新增准备任务"
            }
          ]
        }
      ],
      "defaultChoiceId": "defer",
      "followUpPolicy": "explicit_effects",
      "responseDays": 14,
      "presentation": "ordinary",
      "pausesTime": true
    },
    {
      "id": "PREP-RESEARCH",
      "title": "开展客户需求研究",
      "classification": "fictional",
      "sourceIds": [],
      "effectiveWindow": {
        "from": "2020-02-01",
        "to": "2025-12-31"
      },
      "scope": {
        "binding": "player",
        "businessKind": null
      },
      "trigger": {
        "op": "all",
        "conditions": []
      },
      "priority": 10,
      "exclusiveGroup": null,
      "hiddenFactsPolicy": {
        "mode": "fixed_at_instance_creation",
        "domain": "opportunity"
      },
      "choices": [
        {
          "id": "prepare",
          "label": "投入时间整理准备材料",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 1,
          "costFen": 10000,
          "effects": [
            {
              "op": "startJob",
              "durationDays": 7,
              "capacityUnits": 1,
              "onComplete": [
                {
                  "op": "recordPreparation",
                  "key": "customer_research"
                },
                {
                  "op": "recordCause",
                  "text": "练习材料完成；不代表客户验收、访问许可或经营收入"
                }
              ]
            }
          ]
        },
        {
          "id": "defer",
          "label": "暂不新增承诺",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 0,
          "costFen": 0,
          "effects": [
            {
              "op": "recordCause",
              "text": "保留现有义务，暂不新增准备任务"
            }
          ]
        }
      ],
      "defaultChoiceId": "defer",
      "followUpPolicy": "explicit_effects",
      "responseDays": 14,
      "presentation": "ordinary",
      "pausesTime": true
    },
    {
      "id": "PREP-API",
      "title": "阅读API公告并整理接入前提",
      "classification": "fictional",
      "sourceIds": [
        "H001"
      ],
      "effectiveWindow": {
        "from": "2020-06-11",
        "to": "2025-12-31"
      },
      "scope": {
        "binding": "player",
        "businessKind": null
      },
      "trigger": {
        "op": "hasCapability",
        "capabilityId": "api_announcement"
      },
      "priority": 10,
      "exclusiveGroup": null,
      "hiddenFactsPolicy": {
        "mode": "fixed_at_instance_creation",
        "domain": "opportunity"
      },
      "choices": [
        {
          "id": "prepare",
          "label": "投入时间整理准备材料",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 1,
          "costFen": 0,
          "effects": [
            {
              "op": "startJob",
              "durationDays": 7,
              "capacityUnits": 1,
              "onComplete": [
                {
                  "op": "recordPreparation",
                  "key": "api_application_materials"
                },
                {
                  "op": "recordCause",
                  "text": "练习材料完成；不代表客户验收、访问许可或经营收入"
                }
              ]
            }
          ]
        },
        {
          "id": "defer",
          "label": "暂不新增承诺",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 0,
          "costFen": 0,
          "effects": [
            {
              "op": "recordCause",
              "text": "保留现有义务，暂不新增准备任务"
            }
          ]
        }
      ],
      "defaultChoiceId": "defer",
      "followUpPolicy": "explicit_effects",
      "responseDays": 14,
      "presentation": "ordinary",
      "pausesTime": true
    },
    {
      "id": "PREP-COURSE",
      "title": "整理公开资料与教学案例",
      "classification": "fictional",
      "sourceIds": [
        "H003"
      ],
      "effectiveWindow": {
        "from": "2022-11-30",
        "to": "2025-12-31"
      },
      "scope": {
        "binding": "player",
        "businessKind": null
      },
      "trigger": {
        "op": "hasCapability",
        "capabilityId": "chatgpt_announcement"
      },
      "priority": 10,
      "exclusiveGroup": null,
      "hiddenFactsPolicy": {
        "mode": "fixed_at_instance_creation",
        "domain": "opportunity"
      },
      "choices": [
        {
          "id": "prepare",
          "label": "投入时间整理准备材料",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 1,
          "costFen": 0,
          "effects": [
            {
              "op": "startJob",
              "durationDays": 7,
              "capacityUnits": 1,
              "onComplete": [
                {
                  "op": "recordPreparation",
                  "key": "teaching_outline"
                },
                {
                  "op": "recordCause",
                  "text": "练习材料完成；不代表客户验收、访问许可或经营收入"
                }
              ]
            }
          ]
        },
        {
          "id": "defer",
          "label": "暂不新增承诺",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 0,
          "costFen": 0,
          "effects": [
            {
              "op": "recordCause",
              "text": "保留现有义务，暂不新增准备任务"
            }
          ]
        }
      ],
      "defaultChoiceId": "defer",
      "followUpPolicy": "explicit_effects",
      "responseDays": 14,
      "presentation": "ordinary",
      "pausesTime": true
    },
    {
      "id": "PREP-ECOSYSTEM",
      "title": "评估DeepSeek生态服务前提",
      "classification": "fictional",
      "sourceIds": [
        "H008"
      ],
      "effectiveWindow": {
        "from": "2024-12-27",
        "to": "2025-12-31"
      },
      "scope": {
        "binding": "player",
        "businessKind": null
      },
      "trigger": {
        "op": "hasCapability",
        "capabilityId": "deepseek_v3_announcement"
      },
      "priority": 10,
      "exclusiveGroup": null,
      "hiddenFactsPolicy": {
        "mode": "fixed_at_instance_creation",
        "domain": "opportunity"
      },
      "choices": [
        {
          "id": "prepare",
          "label": "投入时间整理准备材料",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 1,
          "costFen": 0,
          "effects": [
            {
              "op": "startJob",
              "durationDays": 7,
              "capacityUnits": 1,
              "onComplete": [
                {
                  "op": "recordPreparation",
                  "key": "ecosystem_materials"
                },
                {
                  "op": "recordCause",
                  "text": "练习材料完成；不代表客户验收、访问许可或经营收入"
                }
              ]
            }
          ]
        },
        {
          "id": "defer",
          "label": "暂不新增承诺",
          "condition": {
            "op": "all",
            "conditions": []
          },
          "actionPoints": 0,
          "costFen": 0,
          "effects": [
            {
              "op": "recordCause",
              "text": "保留现有义务，暂不新增准备任务"
            }
          ]
        }
      ],
      "defaultChoiceId": "defer",
      "followUpPolicy": "explicit_effects",
      "responseDays": 14,
      "presentation": "ordinary",
      "pausesTime": true
    }
  ],
  "calendar": [
    {
      "definitionId": "PREP-CASE",
      "date": "2020-01-22",
      "bindingId": "player",
      "occurrenceId": "calendar:PREP-CASE"
    },
    {
      "definitionId": "PREP-RESEARCH",
      "date": "2020-02-01",
      "bindingId": "player",
      "occurrenceId": "calendar:PREP-RESEARCH"
    },
    {
      "definitionId": "PREP-API",
      "date": "2020-06-11",
      "bindingId": "player",
      "occurrenceId": "calendar:PREP-API"
    },
    {
      "definitionId": "PREP-COURSE",
      "date": "2022-11-30",
      "bindingId": "player",
      "occurrenceId": "calendar:PREP-COURSE"
    },
    {
      "definitionId": "PREP-ECOSYSTEM",
      "date": "2024-12-27",
      "bindingId": "player",
      "occurrenceId": "calendar:PREP-ECOSYSTEM"
    }
  ],
  "memories": [
    {
      "id": "MEM-CONTENT",
      "domain": "content",
      "hint": "未来内容工具可能变化，先留下可解释的手工案例与客户需求；没有确定收益答案。",
      "preparationKey": "manual_case"
    },
    {
      "id": "MEM-SERVICE",
      "domain": "service",
      "hint": "服务机会仍取决于供应与客户资格，技术发布不会自动变成股权。",
      "preparationKey": "ecosystem_materials"
    },
    {"id":"MEM-LINZHOU","domain":"local_tools","hint":"记得一个虚构协作团队后来把工具交给封闭经营；本局参与可能改变局部合作条件，不代表所有模型或价格都会改变。","preparationKey":"linzhou_pilot"}
  ],
  "initialEntitlements": [
    {
      "backgroundId": "technical_employee",
      "entitlementIds": [
        "basic_programming"
      ]
    },
    {
      "backgroundId": "content_employee",
      "entitlementIds": [
        "audience_research"
      ]
    }
  ]
}
