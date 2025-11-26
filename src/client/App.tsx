import { useState } from "react";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

function Welcome() {
	return <div>
		<h1>Gym Management System</h1>
		<p>Please <Link to={"/app/login"}>log in.</Link></p>
	</div>;
}

function Dashboard() {
	return <div>
		<h1>Gym Management System</h1>
		<p>Welcome to the React version!</p>
	</div>;
}

function Login() {
	const [error, setError] = useState<string | null>(null);
	return <div>
		<form action={(data) => {
			const email = data["email"];
			fetch("/login", {
				method: "POST",
				body: JSON.stringify({ email: email?.toString() }),
			}).then((res) => res.json())
				.then((res) => { // no more type safety :(
					if (!res.success) {
						if (res.errors !== null) {
							setError(res.errors.fieldErrors.email)
							return;
						}
						setError("Invalid login")
					}
				});
		}}>
			<label hidden={error === null}>{error}</label>
			<input name="email" />
			<button type="submit">Login</button>
		</form>
	</div>;
}

function App() {
	return <BrowserRouter>
		<Routes>
			<Route path="/app/" element={<Welcome />} />
			<Route path="/app/dashboard" element={<Dashboard />} />
			<Route path="/app/login" element={<Login />} />
		</Routes>
	</BrowserRouter>;
}

export default App;
