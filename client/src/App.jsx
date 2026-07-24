import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import PropertyDetails from "./pages/PropertyDetails";
import RoomDetails from "./pages/RoomDetails";
import ImageDetails from "./pages/ImageDetails";
import Report from "./pages/Report";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/properties/:id" element={<PropertyDetails />} />
        <Route path="/rooms/:id" element={<RoomDetails />} />
        <Route path="/images/:id" element={<ImageDetails />} />
        <Route path="/reports/:propertyId" element={<Report />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;