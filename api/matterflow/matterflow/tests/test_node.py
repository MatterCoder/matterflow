import unittest
from matterflow import *
from matterflow.nodes import *
from matterflow.tests.sample_test_data import GOOD_NODES, BAD_NODES, DATA_FILES


class NodeTestCase(unittest.TestCase):
    def test_add_join_csv_node(self):
        node_to_add = node_factory(GOOD_NODES["join_node"])
        self.assertIsInstance(node_to_add, JoinNode)

    def test_add_filter_csv_node(self):
        node_to_add = node_factory(GOOD_NODES["filter_node"])
        self.assertIsInstance(node_to_add, FilterNode)

    def test_add_pivot_csv_node(self):
        node_to_add = node_factory(GOOD_NODES["pivot_node"])
        self.assertIsInstance(node_to_add, PivotNode)

    def test_add_graph_csv_node(self):
        node_to_add = node_factory(GOOD_NODES["graph_node"])
        self.assertIsInstance(node_to_add, GraphNode)

    def test_add_string_node(self):
        node_to_add = node_factory(GOOD_NODES["string_input"])
        self.assertIsInstance(node_to_add, StringNode)

    def test_add_integer_node(self):
        node_to_add = node_factory(GOOD_NODES["integer_input"])
        self.assertIsInstance(node_to_add, IntegerNode)

    def test_fail_add_node(self):
        bad_nodes = [
            node_factory(BAD_NODES["bad_node_type"]),
            node_factory(BAD_NODES["bad_flow_node"]),
            node_factory(BAD_NODES["bad_io_node"]),
            node_factory(BAD_NODES["bad_manipulation_node"]),
            node_factory(BAD_NODES["bad_visualization_node"])
        ]

        for bad_node in bad_nodes:
            self.assertIsNone(bad_node)

    def test_flow_node_replacement_value(self):
        node_to_add = node_factory(GOOD_NODES["string_input"])
        self.assertEqual(node_to_add.get_replacement_value(), "key")

    def test_node_to_string(self):
        node_to_add = node_factory(GOOD_NODES["string_input"])
        self.assertEqual(str(node_to_add), "String Input")

    def test_node_to_json(self):
        node_to_add = node_factory(GOOD_NODES["string_input"])

        dict_to_compare = {
            "name": "String Input",
            "node_id": "7",
            "node_type": "flow_control",
            "node_key": "StringNode",
            "data": None,
            "is_global": False,
            "option_replace": {},
            "option_values": {
                "default_value": "key",
                "var_name": "local_flow_var"
            }
        }

        self.assertDictEqual(node_to_add.to_json(), dict_to_compare)

    def test_node_execute_not_implemented(self):
        test_node = Node(dict())
        test_io_node = IONode(dict())
        test_manipulation_node = ManipulationNode(dict())
        test_visualization_node = VizNode(dict())

        nodes = [test_node, test_io_node, test_manipulation_node, test_visualization_node]

        for node_to_execute in nodes:
            with self.assertRaises(NotImplementedError):
                node_to_execute.execute(None, None)

    def test_node_execute_exception(self):
        read_csv_node = node_factory(GOOD_NODES["read_csv_node"])
        write_csv_node = node_factory(GOOD_NODES["write_csv_node"])
        join_node = node_factory(GOOD_NODES["join_node"])

        nodes = [read_csv_node, write_csv_node, join_node]
        for node_to_execute in nodes:
            with self.assertRaises(NodeException):
                node_to_execute.execute(dict(), dict())

    def test_validate_node(self):
        node_to_validate = node_factory(GOOD_NODES["string_input"])
        node_to_validate.validate()

    def test_validate_input_data(self):
        node_to_validate = node_factory(GOOD_NODES["join_node"])
        node_to_validate.validate_input_data(2)

    def test_validate_input_data_exception(self):
        node_to_validate = node_factory(GOOD_NODES["join_node"])

        try:
            node_to_validate.validate_input_data(0)
        except NodeException as e:
            self.assertEqual(str(e), "execute: JoinNode requires 2 inputs. 0 were provided")

