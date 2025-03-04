import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import OAuth2Callback from "./OAuth2Callback";
import Signup from "./pages/Signup";
import Signin from "./pages/Signin";
import ManageBot from "./pages/ManageBot";
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/oauth2callback" element={<OAuth2Callback />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/bot/:botToken/:botId/:status" element={<ManageBot />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
