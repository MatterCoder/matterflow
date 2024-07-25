from matterflow.node import ManipulationNode, NodeException
from matterflow.parameters import *

import pandas as pd


class FilterNode(ManipulationNode):
    name = "Filter"
    num_in = 1
    num_out = 1

    OPTIONS = {
        'items': StringParameter(
            'Items',
            docstring='Keep labels from axis which are in items'
        ),
        'like': StringParameter(
            'Like',
            docstring='Keep labels from axis for which like in label == True.'
        ),
        'regex': StringParameter(
            'Regex',
            docstring='Keep labels from axis for which re.search(regex, label) == True.'
        ),
        'axis': StringParameter(
            'Axis',
            docstring='The axis to filter on.'
        )
    }

    def execute(self, predecessor_data, flow_vars):
        try:
            input_df = pd.DataFrame.from_dict(predecessor_data[0])
            output_df = pd.DataFrame.filter(input_df, **self.options)
            return output_df.to_json()
        except Exception as e:
            raise NodeException('filter', str(e))
