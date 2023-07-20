import FileScreenshot from "./components/fileScreenshot";
import FilZipReader from "./components/fileZipReader";
import "./styles.css";
export default function App() {
  return (
    <div className="App">
      {/* <h1>Hello CodeSandbox</h1>
      <h2>Start editing to see some magic happen!</h2> */}
      <FilZipReader />
    </div>
  );
}
