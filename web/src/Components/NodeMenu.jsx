import React, { useEffect, useState } from "react";
import * as _ from "lodash";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import CustomNodeUpload from "./CustomNodeUpload";
import { Collapse, Input } from "antd";

const CUSTOM_NODES_SECTION = "Custom Nodes";
export default function NodeMenu(props) {
  const [searchText, setSearchText] = useState("");
  const [activeKeys, setActiveKeys] = useState([]);

  useEffect(() => {
    setActiveKeys(_.map(props.nodes, (items, section) => section));
  }, [props.nodes]);

  // construct menu from JSON of node types
  const filteredSections = [CUSTOM_NODES_SECTION];
  const menuItems = _.map(props.nodes, (items, section) => {
    return {
      key: section,
      label: section,
      children: (
        <ul style={{ marginBottom: 0 }}>
          {_.map(items, (item) => {
            const data = { ...item }; // copy so we can mutate
            const config = data.options;
            delete data.options;
            if (
              String(data?.name ?? "")
                .toLowerCase()
                ?.includes(searchText.toLowerCase())
            ) {
              filteredSections.push(section);
              return (
                <NodeMenuItem
                  key={data.node_key || data.filename}
                  nodeInfo={data}
                  config={config}
                />
              );
            } else {
              <></>;
            }
          })}
          {section === CUSTOM_NODES_SECTION ? (
            <CustomNodeUpload onUpload={props.onUpload} />
          ) : (
            <></>
          )}
        </ul>
      ),
    };
  }).filter((item) => filteredSections.includes(item.label));

  return (
    <div className="NodeMenu">
      <h3>Node Menu</h3>
      <div>Drag-and-drop nodes to build a data workflow.</div>
      <Input.Search
        placeholder="Search..."
        onChange={(e) => {
          setSearchText(e.target.value);
        }}
        style={{ marginTop: 16 }}
      />
      <Collapse
        items={menuItems}
        bordered={false}
        ghost
        activeKey={activeKeys}
        onChange={setActiveKeys}
        style={{ margin: "16px -16px" }}
      />
    </div>
  );
}

/**
 * Format docstring with newlines into tooltip content
 * @param string - node docstring
 * @returns {array} - array of strings and HTML elements
 */
function formatTooltip(string) {
  const split = string.split("\n");
  const out = [];
  split.forEach((line, i) => {
    out.push(line);
    out.push(<br key={i} />);
  });
  out.pop();
  return out;
}

function NodeMenuItem(props) {
  if (!props.nodeInfo.missing_packages) {
    const tooltip = props.nodeInfo.doc
      ? formatTooltip(props.nodeInfo.doc)
      : "This node has no documentation.";
    return (
      <OverlayTrigger
        placement="left"
        delay={{ show: 250, hide: 250 }}
        overlay={<NodeTooltip message={tooltip} />}
      >
        <li
          className="NodeMenuItem"
          draggable={true}
          onDragStart={(event) => {
            event.dataTransfer.setData(
              "storm-diagram-node",
              JSON.stringify(props)
            );
          }}
          style={{ color: props.nodeInfo.color, borderRadius: 6 }}
        >
          {props.nodeInfo.name}
        </li>
      </OverlayTrigger>
    );
  } else {
    let tooltip =
      "These Python modules could not be imported:\n\n" +
      props.nodeInfo.missing_packages.join("\n");
    tooltip = formatTooltip(tooltip);
    return (
      <OverlayTrigger
        placement="left"
        delay={{ show: 250, hide: 250 }}
        overlay={<NodeTooltip message={tooltip} />}
      >
        <li className="NodeMenuItem invalid">{props.nodeInfo.filename}</li>
      </OverlayTrigger>
    );
  }
}

// Overlay with props has to use ref forwarding
const NodeTooltip = React.forwardRef((props, ref) => {
  return (
    <Tooltip {...props} ref={ref}>
      <div style={{ textAlign: "left" }}>{props.message}</div>
    </Tooltip>
  );
});

NodeTooltip.displayName = 'NodeTooltip';

