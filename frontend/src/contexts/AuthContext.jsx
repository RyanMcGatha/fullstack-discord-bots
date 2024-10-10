import { createContext, useContext } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const signUp = async () => {
    const response = await axios.post("http://localhost:3000/signup", {
      username,
      email,
      password,
    });
    if (response.status === 200) {
      return response.json({});
    } else {
      console.log("error signing up ");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        signUp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
