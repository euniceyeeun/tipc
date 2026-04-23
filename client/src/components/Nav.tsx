import "./Nav.css";
import { NavLink } from "react-router-dom";

function Nav() {
  return (
      <nav className="nav-bar">
        <NavLink to="/catalog"  className="nav-item">Catalog</NavLink>
        <NavLink to="/join" className="nav-item">Join</NavLink>
        <NavLink to="/about" className="nav-item">About</NavLink>
      </nav>
  );
}

export default Nav;
