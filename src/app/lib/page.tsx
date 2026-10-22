
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../connection-test/supabase";

export default function ConnectionTest() {
  const [message, setMessage] = useState("Testing connection...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase
        .from("departments")
        .select("id")
        .limit(1);

      if (error) {
        setMessage(`Supabase error: ${error.message}`);
      } else {
        setMessage("Supabase connection successful!");
      }
    }

    testConnection();
  }, []);

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">
        NM PACKAGING - Supabase Connection Test
      </h1>
      <p className="mt-4">{message}</p>
    </main>
  );
}