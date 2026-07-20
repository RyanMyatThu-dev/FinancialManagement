"use client";

import React from "react";
import { HelpCircle, ShieldCheck, CheckCircle2, UserX, AlertTriangle, RefreshCcw } from "lucide-react";

export default function SupportPage() {
  const supportDocs = [
    {
      title: "How to Lock/Deactivate a User Account",
      icon: UserX,
      color: "text-red-400 bg-red-500/10 border-red-500/20",
      steps: [
        "Navigate to the 'User Control' tab from the sidebar.",
        "Use the search bar to locate the student using their name, email, or @username.",
        "Click the red 'Lock/Ban' button on the user's row.",
        "The system will set a lockout state in ASP.NET Core Identity. The user's active session will be invalidated, and any future login attempts will be rejected with an 'Account Blocked' notice.",
        "To restore access, click the green unlock icon on the user's row.",
      ],
    },
    {
      title: "Purging and Resetting Student Data",
      icon: RefreshCcw,
      color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      steps: [
        "Caution: This action is destructive and cannot be undone.",
        "Navigate to the 'User Control' tab and locate the user.",
        "Click the 'Rotate/Reset' icon on the user's actions block.",
        "Verify the details in the confirmation modal. This deletes all accounts, transaction logs, categories, budget limits, savings goals, and daily quota pacings.",
        "Click 'Purge All Data'. The student's login remains active, but their app workspaces are entirely empty (like a brand new account). Useful if they mess up their budgets and want a clean start.",
      ],
    },
    {
      title: "Configuring Role Permissions (Dynamic RBAC)",
      icon: ShieldCheck,
      color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
      steps: [
        "Go to the 'RBAC Settings' page.",
        "Select a role from the middle column (e.g. Moderator, CustomerCare).",
        "On the right-side configurator, check or uncheck individual permission nodes to modify access privileges.",
        "Click 'Save Role Permissions'. The permissions mapping updates in the database.",
        "These changes apply in real-time. The next API request made by users of that role will be authorized according to the new configurations (no relogin required).",
      ],
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Operations & Customer Care Guide</h2>
        <p className="text-sm text-zinc-400">Standard operating procedures (SOPs) and manuals for customer support agents.</p>
      </div>

      {/* Warning Alert */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-400 text-xs">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <div className="space-y-1">
          <p className="font-semibold">Security & Privacy Reminder</p>
          <p className="leading-relaxed">
            All user resets, blocks, and permission modifications are logged. Ensure you verify the identity of the student via email or official channels before performing destructive actions (like data purges) or changing user role assignments.
          </p>
        </div>
      </div>

      {/* Docs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {supportDocs.map((doc, idx) => {
          const Icon = doc.icon;
          return (
            <div key={idx} className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-xl space-y-4">
              <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-3">
                <span className={`p-2 rounded-lg border flex items-center justify-center ${doc.color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </span>
                {doc.title}
              </h3>
              <ol className="space-y-2.5 text-xs text-zinc-400 pl-4 list-decimal leading-relaxed">
                {doc.steps.map((step, sIdx) => (
                  <li key={sIdx}>{step}</li>
                ))}
              </ol>
            </div>
          );
        })}

        {/* System Diagnostics Card */}
        <div className="bg-zinc-900/20 border border-zinc-850 p-6 rounded-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-3">
              <span className="p-2 rounded-lg border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <HelpCircle className="h-4.5 w-4.5" />
              </span>
              System Diagnostics
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/60">
                <span className="text-zinc-500">Database Connection</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/60">
                <span className="text-zinc-500">Authentication Service</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Active
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-zinc-850/60">
                <span className="text-zinc-500">Hangfire Quota Scheduler</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Idle (Hourly)
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-zinc-500">JWT Security Token Provider</span>
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Secure
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-850 mt-4 text-[10px] text-zinc-600 text-center">
            ST-Finance Customer Care Portal • version 1.0.4
          </div>
        </div>
      </div>
    </div>
  );
}
