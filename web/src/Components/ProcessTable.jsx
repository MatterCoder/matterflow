import { useEffect, useState } from 'react';
import { Button } from 'antd'; // Import Ant Design Button
import '../styles/Supervisor.css';

const ProcessTable = ({ processes, iframeSrc, setLoadingProcesses }) => {
    const [loading, setLoading] = useState(true);
    const [logTailUrl, setUrl] = useState(null); // Define state to handle logTail URL

    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        //link.href = `${window.location.protocol}//${window.location.hostname}:9001/stylesheets/supervisor.css`;
        document.head.appendChild(link);

        setLoadingProcesses(true);
        setLoading(false);

        return () => {
            document.head.removeChild(link);
            setLoadingProcesses(false);
        };
    }, [setLoadingProcesses]);

    useEffect(() => {
        if (!loading) {
            setLoadingProcesses(false);
        }
    }, [loading, setLoadingProcesses]);

    if (loading) {
        return <div>Loading...</div>;
    }

    const handleManageProcesses = () => {
        setUrl(`${iframeSrc}`);
    };

    // Conditional rendering for LogTail URL or Process Table
    if (logTailUrl) {
        return (
            <div id="wrapper" style={{ width: "100%", minHeight: "400px", paddingBottom: '20px' }}>
                <Button
                    type="primary"
                    onClick={() => setUrl(null)} // Clear logTailUrl to go back to process table
                    style={{ marginBottom: "10px" }}
                >
                    Back to Process List
                </Button>
                <iframe
                    title="LogTail"
                    src={logTailUrl} // Display the logTail URL
                    style={{ width: "100%", height: "500px", border: "none" }}
                />
            </div>
        );
    }

    return (
        <div
            id="wrapper"
            style={{
                width: "100%",
                minHeight: "400px",
                maxHeight: "calc(100vh - 200px)", // Ensures it doesn't overflow vertically in modal
                overflowY: "auto", // Enables scrolling if content exceeds the height
                paddingBottom: '20px', // Adds space at the bottom to avoid overlapping
            }}
        >
            {/* Centered Button to manage processes */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <Button 
                    type="primary" 
                    onClick={handleManageProcesses}
                    style={{ padding: "10px 20px" }}
                >
                    Manage Processes
                </Button>
            </div>

            <table cellSpacing="0" style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th className="state">State</th>
                        <th className="desc">Description</th>
                        <th className="name">Name</th>
                        <th className="action">View Logs</th>
                    </tr>
                </thead>
                <tbody>
                    {processes.map((process, index) => (
                        <tr className={index % 2 === 0 ? "shade" : ""} key={process.name}>
                            <td className="status">
                                <span className={process.state === 20 ? "statusrunning" : "statusstopped"}>
                                    {process.statename.toLowerCase()}
                                </span>
                            </td>
                            <td><span>{process.description}</span></td>
                            <td>
                                <a href="#" onClick={() => setUrl(`${iframeSrc}tail.html?processname=${process.name}`)}>
                                    {process.name}
                                </a>
                            </td>
                            <td className="action">
                                <ul>
                                    <li>
                                        <a href="#" onClick={() => setUrl(`${iframeSrc}logtail/${process.name}`)} name="Tail -f Stdout">
                                            Tail -f Stdout
                                        </a>
                                    </li>
                                    <li>
                                        <a href="#" onClick={() => setUrl(`${iframeSrc}logtail/${process.name}/stderr`)} name="Tail -f Stderr">
                                            Tail -f Stderr
                                        </a>
                                    </li>
                                </ul>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProcessTable;
