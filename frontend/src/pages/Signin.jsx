import { useState } from "react";
import axios from "axios";

const Signin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("http://localhost:3000/signin", {
        username,
        password,
      });
      if (response.status === 200) {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      setError("Signin failed. Please try again.");
    }
  };

  return (
    <div>
      <h1>Signin</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Signin</button>
      </form>
    </div>
  );
};

export default Signin;
