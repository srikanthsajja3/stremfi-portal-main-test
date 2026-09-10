import { useEffect, useState, useContext } from "react";
import { UserContext } from "../UserContext";
import Header from '../Header';
import apiClient from "../../api/client";
import { API_BASE_URL } from "../../config/env";
import "./AdminPreRegister.css";

export default function AdminPreRegister(){
    
 const [users,setUsers]=useState([]);
 const [preview,setPreview]=useState(null);

 const load=()=>{
  apiClient.get("/dashboard/get_prereg_admin.php")
   .then(r=>r.data)
    .then(d=>{
    if(Array.isArray(d)){
    setUsers(d);
    }else{
    console.error(d);
    setUsers([]);
    }
   });
 };

 useEffect(()=>{load()},[]);

 const activate=async(id)=>{
  if(!window.confirm("Activate this user?")) return;

  const fd=new FormData();
  fd.append("id",id);

  await apiClient.post("/dashboard/activate_prereg.php", fd);

  load();
 };

 return(
    <>
    
      <Header />
  <div className="admin-page">

   <h2>Pre-Registered Users</h2>

   <table>
    <thead>
     <tr>
      <th>Name</th>
      <th>Phone</th>
      <th>Email</th>
      <th>Plan</th>
      <th>Screenshot</th>
      <th>Status</th>
      <th>Action</th>
     </tr>
    </thead>

    <tbody>
     {users.map(u=>(
      <tr key={u.id}>
       <td>{u.first_name} {u.last_name}</td>
       <td>{u.phone}</td>
       <td>{u.email}</td>
       <td>{u.plan}</td>

       <td>
        <img
         src={`${API_BASE_URL}/uploads/${u.screenshot}`}
         className="thumb"
         onClick={()=>setPreview(`${API_BASE_URL}/uploads/${u.screenshot}`)}
        />
       </td>

       <td>
        {u.is_activated==1 ? "✅ Activated" : "Pending"}
       </td>

       <td>
        {u.is_activated==0 && (
         <button onClick={()=>activate(u.id)} className="activate-btn">
          Activate
         </button>
        )}
       </td>
      </tr>
     ))}
    </tbody>
   </table>

   {/* IMAGE MODAL */}
   {preview && (
    <div className="img-overlay" onClick={()=>setPreview(null)}>
     <img src={preview} className="full-img"/>
    </div>
   )}

  </div>
  </>
 );
}
