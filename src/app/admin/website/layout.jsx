import AdminSidebar from "../../../../component/admin/AdminSidebar";

export default function WebsiteLayout({children}){

return(

<div className="flex min-h-screen">

<AdminSidebar/>

<main className="flex-1 p-10">
{children}
</main>

</div>

);

}