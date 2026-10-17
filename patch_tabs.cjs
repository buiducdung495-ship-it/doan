const fs = require('fs');

let code = fs.readFileSync('src/App.tsx', 'utf8');

const replacement = `          {currentTab === 'approvals' && (
            <ApprovalInbox
              requests={requests}
              workflows={CLIENT_WORKFLOWS}
              currentUser={currentUser}
              users={users}
              onApprove={handleApproveRequest}
              onReject={handleRejectRequest}
              onAnalyzeAI={handleAnalyzeAI}
            />
          )}
          {currentTab === 'docs-internal' && (
            <InternalDocumentManager currentUser={currentUser!} users={users} />
          )}
          {currentTab === 'contracts' && (
            <ContractManager currentUser={currentUser!} users={users} />
          )}
          {currentTab === 'events' && (
            <CalendarManager currentUser={currentUser!} users={users} />
          )}
          {currentTab === 'kpi' && (
            <KPIManager currentUser={currentUser!} users={users} setUsers={setUsers} />
          )}
          {currentTab === 'user-management' && (
            <UserManager users={users} currentUser={currentUser!} onUserUpdate={handleSaveProfile} onUserChange={setCurrentUser} />
          )}
          {currentTab === 'tasks' && (
            <TaskManager currentUser={currentUser!} users={users} />
          )}
          {currentTab === 'audit-logs' && (
            <AuditLogManager />
          )}
          {currentTab === 'shared-categories' && (
            <SharedCategoryManager />
          )}
          {currentTab === 'ocr-manager' && (
            <OCRManager currentUser={currentUser!} users={users} />
          )}
          {currentTab === 'chat' && (
            <LiveChat 
              chatMessages={chatMessages}
              currentUser={currentUser!}
              allUsers={users}
              chatGroups={[]}
              onRefreshGroups={() => {}}
              onSendMessage={handleSendChatMessage}
            />
          )}
        </main>
      </div>
    </div>
  );
}`;

code = code.replace(/\{currentTab === 'approvals' && \([\s\S]*?\}\n\s*\);/m, replacement);

fs.writeFileSync('src/App.tsx', code);
console.log('patched');
