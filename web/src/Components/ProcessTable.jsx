import { useEffect, useState } from 'react';
import { Button } from 'antd'; // Import Antd Button

const ProcessTable = ({ processes, iframeSrc, setLoadingProcesses }) => {
    const [loading, setLoading] = useState(true);

    // Dynamically inject the CSS into the head of the document
    useEffect(() => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = `${window.location.protocol}//${window.location.hostname}:9001/stylesheets/supervisor.css`;
        document.head.appendChild(link);

        // Set loadingProcesses to true initially
        setLoadingProcesses(true);

        // Set loading to false when the content has finished loading
        setLoading(false);

        // Cleanup function to remove the link tag if the component is unmounted
        return () => {
            document.head.removeChild(link);
            setLoadingProcesses(false);
        };
    }, [setLoadingProcesses]);

    useEffect(() => {
        if (!loading) {
            setLoadingProcesses(false); // Set loadingProcesses to false when loading is complete
        }
    }, [loading, setLoadingProcesses]);

    if (loading) {
        return <div>Loading...</div>; // Display loading state
    }

    const handleManageProcesses = () => {
        window.open(`${iframeSrc}`, '_blank'); // Open the iFrame src in a new tab
    };

    return (
        <div id="wrapper" style={{ width: "100%", minHeight: "400px" }}>
            {/* Centered Button to manage processes */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
                <Button 
                    type="primary" 
                    onClick={handleManageProcesses}
                    style={{ padding: "10px 20px" }} // Adjust padding for a better look
                >
                    Manage Processes
                </Button>
            </div>
            <table cellSpacing="0">
                <thead>
                    <tr>
                        <th className="state">State</th>
                        <th className="desc">Description</th>
                        <th className="name">Name</th>
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
                                <a href={`${iframeSrc}tail.html?processname=${process.name}`} target="_blank" rel="noopener noreferrer">
                                    {process.name}
                                </a>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProcessTable;
