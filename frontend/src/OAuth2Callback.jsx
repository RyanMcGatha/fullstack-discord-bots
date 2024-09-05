import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";

function OAuth2Callback() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get("code");

    if (code) {
      axios
        .post("http://localhost:3000/oauth2callback", { code })
        .then((response) => {
          console.log("Token exchange successful:", response.data);
          navigate("/"); // Redirect the user after successful authentication
        })
        .catch((error) => {
          console.error("Error exchanging code for tokens:", error);
        });
    }
  }, [location, navigate]);

  return <div>Processing OAuth2 callback...</div>;
}

export default OAuth2Callback;
