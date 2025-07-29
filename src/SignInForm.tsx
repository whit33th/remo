// "use client";
// import { useAuthActions } from "@convex-dev/auth/react";
// import { useState } from "react";
// import { toast } from "sonner";

// export function SignInForm() {
//   const { signIn } = useAuthActions();
//   const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
//   const [submitting, setSubmitting] = useState(false);

//   return (
//     <div className="w-full">
//       <form
//         className="gap-form-field flex flex-col"
//         onSubmit={(e) => {
//           e.preventDefault();
//           setSubmitting(true);
//           const formData = new FormData(e.target as HTMLFormElement);
//           formData.set("flow", flow);
//           void signIn("password", formData).catch((error) => {
//             let toastTitle = "";
//             if (error.message.includes("Invalid password")) {
//               toastTitle = "Invalid password. Please try again.";
//             } else {
//               toastTitle =
//                 flow === "signIn"
//                   ? "Could not sign in, did you mean to sign up?"
//                   : "Could not sign up, did you mean to sign in?";
//             }
//             toast.error(toastTitle);
//             setSubmitting(false);
//           });
//         }}
//       >
//         <input
//           className="auth-input-field"
//           type="email"
//           name="email"
//           placeholder="Email"
//           required
//         />
//         <input
//           className="auth-input-field"
//           type="password"
//           name="password"
//           placeholder="Password"
//           required
//         />
//         <button className="auth-button" type="submit" disabled={submitting}>
//           {flow === "signIn" ? "Sign in" : "Sign up"}
//         </button>
//         <div className="text-center text-sm text-secondary">
//           <span>
//             {flow === "signIn"
//               ? "Don't have an account? "
//               : "Already have an account? "}
//           </span>
//           <button
//             type="button"
//             className="cursor-pointer font-medium text-primary hover:text-primary-hover hover:underline"
//             onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
//           >
//             {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
//           </button>
//         </div>
//       </form>
//       <div className="my-3 flex items-center justify-center">
//         <hr className="my-4 grow border-neutral-900" />
//         <span className="mx-4 text-secondary">or</span>
//         <hr className="my-4 grow border-neutral-900" />
//       </div>
//       <button className="auth-button" onClick={() => void signIn("anonymous")}>
//         Sign in anonymously
//       </button>
//     </div>
//   );
// }
