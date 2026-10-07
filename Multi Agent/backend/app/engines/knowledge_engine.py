import os
import json
import logging
from typing import Dict, Any, List, Optional

logger = logging.getLogger("FluxCore.KnowledgeEngine")

class KnowledgeEngine:
    def __init__(self, knowledge_dir: str = "knowledge"):
        self.knowledge_dir = knowledge_dir
        self._rules: Dict[str, List[Dict[str, Any]]] = {}
        self.load_libraries()

    def load_libraries(self):
        """Discovers and parses JSON rules inside the target directory."""
        if not os.path.exists(self.knowledge_dir):
            logger.warning(f"Knowledge directory '{self.knowledge_dir}' does not exist. Creating it.")
            os.makedirs(self.knowledge_dir, exist_ok=True)
            self._create_stub_libraries()

        for filename in os.listdir(self.knowledge_dir):
            if filename.endswith(".json"):
                category = filename.replace(".json", "")
                filepath = os.path.join(self.knowledge_dir, filename)
                try:
                    with open(filepath, "r") as f:
                        rules_list = json.load(f)
                        if isinstance(rules_list, list):
                            self._rules[category] = rules_list
                            logger.info(f"Loaded {len(rules_list)} rules into knowledge category: {category}")
                        else:
                            logger.error(f"Failed loading {filename}: JSON root must be a list of rules.")
                except Exception as e:
                    logger.error(f"Failed loading knowledge file {filename}: {e}")

    def query_rules(self, category: str, query_tag: Optional[str] = None) -> List[Dict[str, Any]]:
        """Queries rules within a category, matching tags if provided."""
        category_rules = self._rules.get(category, [])
        if not query_tag:
            return category_rules
        
        results = []
        for rule in category_rules:
            tags = rule.get("tags", [])
            if query_tag in tags or query_tag.lower() in [t.lower() for t in tags]:
                results.append(rule)
        return results

    def get_rule_by_code(self, category: str, code: str) -> Optional[Dict[str, Any]]:
        category_rules = self._rules.get(category, [])
        for rule in category_rules:
            if rule.get("code") == code:
                return rule
        return None

    def _create_stub_libraries(self):
        """Creates stub libraries when running for the first time."""
        stub_data = {
            "battery_rules": [
                {
                    "code": "BESS-SOC-LIMIT",
                    "title": "BESS Charge/Discharge Boundary",
                    "description": "Standard SOC constraints mapping to cell life.",
                    "tags": ["battery", "constraints"],
                    "min_soc": 10.0,
                    "max_soc": 95.0
                }
            ],
            "ieee_standards": [
                {
                    "code": "IEEE-1547",
                    "title": "Interconnection of Distributed Resources",
                    "description": "IEEE Standard for Interconnecting Distributed Resources with Electric Power Systems.",
                    "tags": ["interconnection", "standards"],
                    "voltage_trip_sec": 2.0
                }
            ]
        }
        for category, rules in stub_data.items():
            filepath = os.path.join(self.knowledge_dir, f"{category}.json")
            try:
                with open(filepath, "w") as f:
                    json.dump(rules, f, indent=4)
                logger.info(f"Created stub knowledge file: {filepath}")
            except Exception as e:
                logger.error(f"Failed to create stub file {filepath}: {e}")

# Global instance for DI
knowledge_engine = KnowledgeEngine()
