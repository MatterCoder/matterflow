from matterflow.node import FlowNode, NodeException
from matterflow.parameters import *


class IntegerNode(FlowNode):
    """StringNode object

    Allows for Strings to replace 'string' fields in Nodes
    """
    name = "Integer Input"
    num_in = 0
    num_out = 0
    color = 'purple'

    OPTIONS = {
        "default_value": IntegerParameter(
            "Default Value",
            docstring="Value this node will pass as a flow variable"
        ),
        "var_name": StringParameter(
            "Variable Name",
            default="my_var",
            docstring="Name of the variable to use in another Node"
        )
    }
