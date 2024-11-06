from matterflow.node import FlowNode, NodeException
from matterflow.parameters import *
import jmespath
import json

class DynamicNode(FlowNode):
    """DynamicNode object

    Allows for Strings to be dyanmically read in to replace 'string' fields in Nodes
    """
    name = "Dynamic Input"
    num_in = 1
    num_out = 0
    color = 'purple'

    OPTIONS = {
        "default_value": StringParameter(
            "Default Value",
            docstring="Value this node will pass as a flow variable if no dymanic input is found"
        ),
        "var_name": StringParameter(
            "Variable Name",
            default="my_var",
            docstring="Name of the variable to use in another Node"
        ),
        "expression": StringParameter(
            "Expression",
            default='*',
            docstring="Extract text using this JMESPath expression"
        )
    }

    def execute(self, predecessor_data, flow_vars):

        filter_settings = flow_vars["expression"].get_value()
        default_value = flow_vars["default_value"].get_value()

        #filter the input if required        
        filter = '*' #match everything but overwrite below if we have a filter
        if len(filter_settings)>0:
            filter = filter_settings

        data = jmespath.search(filter, predecessor_data[0])

        # Check if data is a primitive type (str, int, float, bool) and not None
        if data is not None and isinstance(data, (str, int, float, bool)):
            return json.dumps({
                "value": data
            })
        else:
            print("dynamic import not found, returning default value")
            returnObj = {
                "value": default_value
            }
            return json.dumps(returnObj)
