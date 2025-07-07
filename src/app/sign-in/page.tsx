"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignIn from "@clerk/elements/sign-in";
import { useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
const LoginPage = () => {
  const {  user } = useUser();
  const router = useRouter();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  useEffect(() => {
    const role = user?.publicMetadata.role;
    if (role) {
      setIsAuthenticating(true);
      switch (role) {
        case "secretary":
          router.push("/dashboard");
          break;
        case "chairman":
          router.push("/dashboard");
          break;
        default:
          router.push("/unauthorized");
          break;
      }
    }
  }, [user, router]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <SignIn.Root>
          <SignIn.Step name="start">
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/10">
              <div className="p-8">
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center mb-8"
                >
                  <motion.div
                    whileHover={{ rotate: 5, scale: 1.05 }}
                    className="relative w-24 h-24 mb-4"
                  >
                    <Image
                      src="/edirlogo.jpg"
                      alt="Edir Logo"
                      fill
                      className="object-cover rounded-full border-4 border-white/50 shadow-lg"
                    />
                    <div className="absolute inset-0 rounded-full border-2 border-white/20 animate-ping opacity-0" />
                  </motion.div>
                  <h1 className="text-4xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                    Edir
                  </h1>
                  <p className="text-white/80 mt-2 text-sm">Welcome back</p>
                </motion.div>
                <div className="space-y-6">
                  <Clerk.GlobalError className="block px-4 py-3 bg-red-500/20 text-red-100 rounded-lg text-sm border border-red-500/30" />
                  <Clerk.Field name="identifier" className="space-y-2">
                    <Clerk.Label className="block text-sm font-medium text-white/80">
                      Email or Username
                    </Clerk.Label>
                    <div className="relative">
                      <Clerk.Input
                        type="text"
                        required
                        disabled={isAuthenticating}
                        className="block w-full px-4 py-3 bg-white/10 text-white placeholder-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your email or username"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-white/50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                          />
                        </svg>
                      </div>
                    </div>
                    <Clerk.FieldError className="block text-sm text-red-300 mt-1" />
                  </Clerk.Field>

                  <Clerk.Field name="password" className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Clerk.Label className="block text-sm font-medium text-white/80">
                        Password
                      </Clerk.Label>
                    </div>
                    <div className="relative">
                      <Clerk.Input
                        type="password"
                        required
                        disabled={isAuthenticating}
                        className="block w-full px-4 py-3 bg-white/10 text-white placeholder-white/30 rounded-xl focus:ring-2 focus:ring-white/50 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Enter your password"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-white/50"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                    </div>
                    <Clerk.FieldError className="block text-sm text-red-300 mt-1" />
                  </Clerk.Field>

                  <SignIn.Action
                    submit
                    disabled={isAuthenticating}
                    className={`w-full px-6 py-4 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
                      isAuthenticating
                        ? "bg-gradient-to-r from-indigo-500/50 to-purple-500/50 cursor-not-allowed"
                        : "bg-gradient-to-r from-indigo-500 to-purple-500 hover:-translate-y-0.5"
                    }`}
                  >
                    <motion.span
                      whileTap={!isAuthenticating ? { scale: 0.95 } : {}}
                      className="flex items-center justify-center gap-2"
                    >
                      {isAuthenticating ? (
                        <>
                          <svg
                            className="animate-spin h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Authenticating...
                        </>
                      ) : (
                        <>
                          Sign In
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                            />
                          </svg>
                        </>
                      )}
                    </motion.span>
                  </SignIn.Action>
                </div>
              </div>
            </div>
          </SignIn.Step>
        </SignIn.Root>
      </motion.div>
    </div>
  );
};
export default LoginPage;
