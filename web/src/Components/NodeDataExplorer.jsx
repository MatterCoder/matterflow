import { DownOutlined } from "@ant-design/icons";
import { Dropdown as AntdDropdown, Button } from "antd";
import React, { useEffect, useState } from "react";
import * as API from "../API";

const useFetch = () => {
  const [nodes, setNodes] = useState({
    title: "GetNodeData",
    items: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      API.getFlows().then((value) => {
        var new_nodes = {
          title: "GetNodeData",
          items: [],
        };
        for (let i = 0; i < value.data.length; i++) {
          var matterflow = JSON.parse(value.data[i]["json_data"])["matterflow"];
          var flowname = value.data[i]["description"];
          var flow = {
            label: flowname,
            items: [],
          };

          try {
            var nodes = matterflow["graph"]["nodes"];
            for (let j = 0; j < nodes.length; j++) {
              var node = nodes[j];
              var node_id = node["node_id"];
              var data = node["data"];
              flow.items.push({
                label: node["name"],
                node_id: node_id,
                data: data,
              });
            }
            new_nodes.items.push(flow);
          } catch (error) {
            console.log(error);
          }
        }
        setNodes(new_nodes);
      });
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { nodes, loading, error };
};

const handleNodeSelect = (handleNodeData, nodeFile) => {
//  API.retrieveData(nodeId).then((value) => {
//    handleNodeData(value);
//  });

  API.retrieveDataByFile(null, nodeFile).then((value) => {
    handleNodeData(value);
  });
};

const NodeDataExplorer = ({ handleNodeData }) => {
  const { nodes, loading, error } = useFetch();

  const getMenuItems = React.useCallback(
    (items) => {
      if (!items) return undefined;
      return items.map((item, index) => {
        return {
          label: item.label,
          //key: item.node_id || `${item.node_id}:${item.data}`,
          key: item.data || `${item.label}-${index}`,
          children: getMenuItems(item.items),
        };
      });
    },
    []
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <AntdDropdown
      menu={{
        items: getMenuItems(nodes?.items),
        onClick: (menu) => {
          handleNodeSelect(handleNodeData, menu.key);
        },
      }}
    >
      <Button style={{ width: "fit-content", marginTop: 20  }}>
        {nodes.title} <DownOutlined />
      </Button>
    </AntdDropdown>
  );
};

export default NodeDataExplorer;
