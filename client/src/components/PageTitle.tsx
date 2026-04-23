import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import "../components/PageTitle.css";

type PageTitleProps = {
  className?: string;
};

function PageTitle({ className }: PageTitleProps) {
  const location = useLocation();
  const isHome = location.pathname === "/";
  const combinedClassName = ["site-name", className].filter(Boolean).join(" ");

  return (
    <>
    {isHome ? (
    <div className={combinedClassName}>Texts In Perennial Circulation</div>
  ) : (
    <NavLink to="/" className={combinedClassName}>Texts In Perennial Circulation</NavLink>
  )}
  </>
  )
}
export default PageTitle;
