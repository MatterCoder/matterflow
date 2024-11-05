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
        "filter": StringParameter(
            "Filter",
            default='*',
            docstring="Jmespath query to filter"
        )
    }

    def execute(self, predecessor_data, flow_vars):

        filter_settings = flow_vars["filter"].get_value()
        default_value = flow_vars["default_value"].get_value()

        #filter the input if required        
        filter = '*' #match everything but overwrite below if we have a filter
        if len(filter_settings)>0:
            filter = filter_settings

        data = jmespath.search(filter, predecessor_data[0])

        if data is not None:
            return json.dumps({
                "value": data
            })
        else:
            print("dynamic import no found, returning default value")
            returnObj = {
                "value": default_value
            }
            return json.dumps(returnObj)
