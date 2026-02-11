import { Outlet } from "react-router-dom";
import  Navbar  from "../layouts/navbar";
import Footer from "../layouts/footer";

function AppLayout()
{
    return (
        <div>
            <Navbar />
            <div className="pt-17 px-4">
            <Outlet />
            </div>
            <Footer />
        </div>
    );
}
export default AppLayout;   