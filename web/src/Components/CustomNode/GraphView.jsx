import propTypes from "prop-types";
import React from 'react';
import { Button, Spinner } from "react-bootstrap";
import { VegaLite } from "react-vega";
import { Tabs, Table } from "antd";
import * as API from "../../API";
import "../../styles/GraphView.css";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import ResizableDrawer from "../ResizableDrawer";

export default class GraphView extends React.Component {
  constructor(props) {
    super(props);
    this.key_id = props.node.getNodeId();
    this.serialized_node = props.node.serialize();
    this.state = {
      loading: false,
      data: [],
      rows: [],
      columns: [],
      maxWidth: 0,
    };
  }

  onClose = () => {
    this.props.toggleShow();
  };


  load = async () => {
    this.setState({ loading: true });

    API.retrieveData(this.key_id)
      .then((json) => {
        const columns = Object.keys(json);
        const rows = Object.keys(json[columns[0]]);

        this.setState({
          data: json,
          columns: columns,
          rows: rows,
          loading: false,
        });
      })
      .catch((err) => { 
        console.error(err)
        this.setState({loading: false});
      });
  };

  loadGraph = async () => {
    this.setState({ loading: true });
    API.retrieveData(this.key_id)
      .then((json) => {
        this.setState({
          data: json,
          loading: false,
        });
      })
      .catch((err) => console.log(err));
  };

  downloadFile = async () => {
    API.downloadDataFile(this.serialized_node)
      .then((json) => {
        console.log(json);
      })
      .catch((err) => console.log(err));
  };

  transformJsonToTableData = (jsonData) => {
    // Utility function to validate and convert jsonData
    // Helper functions for validation
    function isObjectArrayLike(obj) {
      const keys = Object.keys(obj);
      return keys.every((key, index) => Number(key) === index);
    }

    function hasNestedStructure(value) {
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => typeof v === 'object' && v !== null);
      }
      return false;
    }

    // Main validation logic (canGenerateTable equivalent)
    if (Array.isArray(jsonData)) {
      const isValid = jsonData.every((row) => {
        return typeof row === 'object' && !Array.isArray(row) && !hasNestedStructure(row);
      });
      if (!isValid) return null;
    } else if (typeof jsonData === 'object' && jsonData !== null) {
      const keys = Object.keys(jsonData);
      const isArrayOfArrays = keys.every((key) => {
        const value = jsonData[key];
        return Array.isArray(value) || (typeof value === 'object' && isObjectArrayLike(value));
      });

      if (!isArrayOfArrays) return null;

      const firstArrayLength = Array.isArray(jsonData[keys[0]]) ? jsonData[keys[0]].length : Object.keys(jsonData[keys[0]]).length;
      const areEqualLength = keys.every((key) => {
        const length = Array.isArray(jsonData[key]) ? jsonData[key].length : Object.keys(jsonData[key]).length;
        return length === firstArrayLength;
      });

      if (!areEqualLength) return null;
    } else {
      return null;
    }

    // Transform the JSON data into a row-oriented format for Antd table
    const keys = Object.keys(jsonData);
    const numRows = Object.keys(jsonData[keys[0]]).length;
    const rows = [];
    for (let i = 0; i < numRows; i++) {
      const row = { key: i.toString() };
      keys.forEach((key) => {
        row[key] = jsonData[key][i];
      });
      rows.push(row);
    }

    // Dynamically create the columns based on the keys
    const columns = keys.map((key) => ({
      title: key,
      dataIndex: key,
      key,
    }));

    // Return transformed data for Antd table
    return { dataSource: rows, columns };
  };


  render() {
    let body;
    let footer;

    if (this.state.loading) {
      // Print loading spinner
      body = <Spinner animation="border" />;
    } else if (this.state.data.length < 1) {
      // Print message to load respective table/graph
      if (this.props.node.options.node_type === "visualization") {
        // Print instructions about loading
        body =
          "Loading the graph might take a while depending on how big the data is.";
        footer = (
          <div style={{ marginTop: 8 }}>
            <Button variant="secondary" onClick={this.onClose}>
              Cancel
            </Button>{" "}
            <Button
              variant="secondary"
              disabled={this.props.node.options.status !== "complete"}
              onClick={this.loadGraph}
            >
              Load
            </Button>
          </div>
        );
      } else {
        // Print instructions about loading
        body = this.props.node.options.status === "complete" ? "Press Load or Reload to see the data." : "";
        
        footer = (
          <div style={{ marginTop: 8 }}>
            <Button variant="secondary" onClick={this.onClose}>
              Cancel
            </Button>{" "}
            <Button
              variant="secondary"
              disabled={this.props.node.options.status !== "complete"}
              onClick={this.load}
            >
              Load
            </Button>
            { this.props.node.options.status !== "complete" &&        
               <p>No results to show</p>
            }            
          </div>
        );
      }
    } else {
      // Display the visualization
      if (this.props.node.options.node_type === "visualization") {
        // Display the graph
        body = <VegaLite spec={this.state.data} />;
      } else {
        // Display the grid

        const tabsArray = [
          {
            label: "Raw Data",
            key: "RawData",
            children: this.props.node.options.status === "complete" ? <p>{JSON.stringify(this.state.data)}</p> : <></>,
          },
          {
            label: "JSON Viewer",
            key: "JSON Viewer",
            children: this.props.node.options.status === "complete" ?  (
              <JsonView
                collapsed
                src={this.state.data}
                style={{ marginBottom: 10 }}
              />
            ) : <></>,
          },
        ];

        const transformedData = this.transformJsonToTableData(this.state.data);
        if (transformedData) {
          tabsArray.push({
            label: "Table Viewer",
            key: "Table Viewer",
            children: (
              <Table dataSource={transformedData.dataSource} columns={transformedData.columns} />
            ),
          });
        }


        body = (
          <>
          <Tabs
            items={tabsArray}
            size="small"
          ></Tabs>
            <Button variant="secondary" onClick={this.onClose}>
              Cancel
            </Button>{" "}
            <Button
              variant="secondary"
              disabled={this.props.node.options.status !== "complete"}
              onClick={this.load}
            >
              Reload
            </Button>          
          { this.props.node.options.status !== "complete"  &&        
            <p>No new results to show</p>
          }
          </>
        );
      }
    }
    console.log(this.state.data);

    return (
      <>
        <ResizableDrawer
          open={this.props.show}
          onClose={this.props.toggleShow}
          placement="bottom"
          title={
            <>
              <b>{this.props.node.options.name}</b> View
            </>
          }
        >
          <div>
            <div>{body}</div>
            {footer}
          </div>
        </ResizableDrawer>
      </>
    );
  }
}

GraphView.propTypes = {
  show: propTypes.bool,
  toggleShow: propTypes.func,
  onClose: propTypes.func,
};

