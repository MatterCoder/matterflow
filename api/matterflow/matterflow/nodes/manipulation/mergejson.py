from matterflow.node import ManipulationNode, NodeException
from matterflow.parameters import *

import pandas as pd
import json
import jmespath
from collections import defaultdict


#######################
def merge_jsons(json1, json2, jmespath_expr_for_matching, jmespath_expr_for_insertion, append=False):
    """
    Merges json2 into json1 based on matching certain fields using JMESPath expressions.

    :param json1: The first JSON object (into which data will be merged).
    :param json2: The second JSON object (data from here will be merged into json1).
    :param jmespath_expr_for_matching: JMESPath expression to identify the data from json2.
    :param jmespath_expr_for_insertion: JMESPath expression to find where the data from json2 should be inserted in json1.
    :param append: Boolean flag indicating whether to append the matched data or replace it.
    
    :return: The merged JSON object.
    """
    
    # Extract the data from json2 based on the jmespath expression
    json2_data = jmespath.search(jmespath_expr_for_matching, json2)
    
    if json2_data is None:
        raise ValueError(f"No matching data found in json2 for expression: {jmespath_expr_for_matching}")
    
    # Find the place in json1 where the data from json2 should be inserted
    json1_insertion_point = jmespath.search(jmespath_expr_for_insertion, json1)
    
    if json1_insertion_point is None:
        raise ValueError(f"No matching insertion point found in json1 for expression: {jmespath_expr_for_insertion}")
    
    # Handle different cases of merging
    if append:
        if isinstance(json1_insertion_point, list):
            json1_insertion_point.append(json2_data)
        else:
            raise TypeError(f"Cannot append data to non-list insertion point for expression: {jmespath_expr_for_insertion}")
    else:
        # Replace the insertion point data with the matched data from json2
        json1_insertion_point = json2_data
    
    return json1
#######################

class MergeJsonNode(ManipulationNode):
    """MergeJsonNode

    Merges the incoming json into another.

    Raises:
        NodeException: any error merging Json files, converting
            from json data.
    """

    name = "MergeJson"
    num_in = 2
    num_out = 1

    OPTIONS = {
        "jmespath_expr_for_matching": StringParameter(
            "JmespathMatching",
            default='*',
            docstring="Jmespath expression for matchong"
        ),
        "jmespath_expr_for_insertion": StringParameter(
            "JmespathInsertion",
            default='*',
            docstring="Jmespath expression for insertion"
        ),
        "append": BooleanParameter(
            "Append",
            default=True,
            docstring="A boolean flag indicating whether to append the data from input2 to the insertion point in input1 or replace the content at the insertion point."
        ),
    }

    def execute(self, predecessor_data, flow_vars):

        json1 = predecessor_data[1]
        json2 = predecessor_data[0] # the json from the websocket is always first
        jmespath_expr_for_matching = flow_vars["jmespath_expr_for_matching"].get_value()
        jmespath_expr_for_insertion = flow_vars["jmespath_expr_for_insertion"].get_value()
        append = flow_vars["append"].get_value()

        # Merge JSON data and convert to string
        try:
            json_object = merge_jsons(json1, json2, jmespath_expr_for_matching, jmespath_expr_for_insertion, append)
            json_string = json.dumps(json_object)

            return json_string

        except Exception as e:
            raise NodeException('mergejson', str(e))
