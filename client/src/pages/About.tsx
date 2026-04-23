import "./About.css";
import { NavLink } from "react-router-dom";
import logo from "../assets/Vector 6.png";

function About() {
  return (
    <>
    <div id="contact-container">Contact yeeunfilm23@gmail.com for inquiries.</div>
      <div id="about-container" className="content-container">
        <div>
        <i>Texts In Perennial Circulation</i> (TIPC) is an NYC-Based, Friends-Owned
        Library. We believe in the free circulation of written art and knowledge as
        a mode of human connection.<br/>
        </div>
        <NavLink to="/" id="about-image"><img src={logo}/></NavLink>
      </div>
    </>
  );
}

export default About;
