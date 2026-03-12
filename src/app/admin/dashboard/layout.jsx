import AdminTopSwitch from "../../../../component/admin/AdminTopSwitch";

export default function WebsiteLayout({children}){

return(

<div className="flex min-h-screen">

<AdminTopSwitch/>

<main className="flex-1 p-10">
{children}
</main>

</div>

);

}