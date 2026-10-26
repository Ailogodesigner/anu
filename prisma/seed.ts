import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding VPS Hosting Bot & Dashboard database...");

  // 1. Initial Staff Members (Matching Cavrix Cloud Discord Roles)
  const adminStaff = await prisma.user.upsert({
    where: { discordId: "100000000000000001" },
    update: {},
    create: {
      discordId: "100000000000000001",
      username: "FaaizXD_Founder",
      avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop&crop=faces",
      role: "ADMIN",
      status: "ONLINE",
      activeTicketsCount: 1,
      totalResolvedTickets: 240,
      avgRating: 5.0,
      lastActiveAt: new Date(),
    },
  });

  const leadStaff = await prisma.user.upsert({
    where: { discordId: "100000000000000002" },
    update: {},
    create: {
      discordId: "100000000000000002",
      username: "Shivam_Manager",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=128&h=128&fit=crop&crop=faces",
      role: "SUPPORT_LEAD",
      status: "ONLINE",
      activeTicketsCount: 3,
      totalResolvedTickets: 312,
      avgRating: 4.95,
      lastActiveAt: new Date(),
    },
  });

  const agentStaff = await prisma.user.upsert({
    where: { discordId: "100000000000000003" },
    update: {},
    create: {
      discordId: "100000000000000003",
      username: "PurpleGamerz_TrialStaff",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=128&h=128&fit=crop&crop=faces",
      role: "SUPPORT_AGENT",
      status: "ONLINE",
      activeTicketsCount: 2,
      totalResolvedTickets: 110,
      avgRating: 4.85,
      lastActiveAt: new Date(),
    },
  });

  // 2. Guild Configuration
  await prisma.guildConfig.upsert({
    where: { guildId: "123456789012345678" },
    update: {},
    create: {
      guildId: "123456789012345678",
      guildName: "Cavrix Cloud",
      ticketCategoryId: "990000000000000001",
      transcriptChannelId: "990000000000000002",
      auditLogChannelId: "990000000000000003",
      announcementChannelId: "990000000000000004",
      adminRoleId: "880000000000000001",
      supportRoleId: "880000000000000002",
      escalationRoleId: "880000000000000003",
      maxTicketsPerUser: 3,
      autoCloseHours: 48,
      enableAiSupport: true,
      aiEscalationSensitivity: "NORMAL",
    },
  });

  // 3. Ticket Categories
  const catNetwork = await prisma.ticketCategory.upsert({
    where: { slug: "vps-connectivity-network" },
    update: {},
    create: {
      name: "VPS Connectivity & Network",
      slug: "vps-connectivity-network",
      description: "DDoS attacks, packet loss, latency spikes, BGP routing and ping timeouts",
      emoji: "🌐",
      defaultPriority: "URGENT",
      order: 1,
    },
  });

  const catSsh = await prisma.ticketCategory.upsert({
    where: { slug: "ssh-access-firewall" },
    update: {},
    create: {
      name: "SSH Access & Firewall",
      slug: "ssh-access-firewall",
      description: "Port 22 connection refused, SSH key auth, UFW/iptables lockouts and VNC access",
      emoji: "🔑",
      defaultPriority: "HIGH",
      order: 2,
    },
  });

  const catResources = await prisma.ticketCategory.upsert({
    where: { slug: "resource-performance" },
    update: {},
    create: {
      name: "Resource & Performance",
      slug: "resource-performance",
      description: "OOM killer, 100% CPU spikes, disk full warnings, and hardware resizing",
      emoji: "⚡",
      defaultPriority: "MEDIUM",
      order: 3,
    },
  });

  const catBilling = await prisma.ticketCategory.upsert({
    where: { slug: "billing-inquiries" },
    update: {},
    create: {
      name: "Billing & Invoices",
      slug: "billing-inquiries",
      description: "Payment queries, invoice copies, billing cycle modifications and upgrades",
      emoji: "💳",
      defaultPriority: "LOW",
      order: 4,
    },
  });

  // 4. Knowledge Base Articles
  await prisma.knowledgeBaseArticle.upsert({
    where: { slug: "troubleshooting-ssh-connection-refused-timeout" },
    update: {},
    create: {
      title: "Troubleshooting SSH Connection Refused & Timeout",
      slug: "troubleshooting-ssh-connection-refused-timeout",
      category: "SSH",
      content: `### Symptom
When attempting to connect via \`ssh root@<server-ip>\`, the client returns \`Connection refused\` or \`Connection timed out\`.

### Diagnostic Steps
1. **Connection Refused**:
   - Indicates the packet reached your VPS, but no service is listening on the targeted port (usually 22).
   - If you modified \`/etc/ssh/sshd_config\` to a custom port (e.g., 2222), append \`-p <port>\` to your SSH command: \`ssh -p 2222 root@<ip>\`.
   - Connect via your web VNC emergency console to verify sshd status: \`sudo systemctl status sshd\` or \`sudo systemctl status ssh\`.
   - If inactive, restart it: \`sudo systemctl restart sshd\`.

2. **Connection Timed Out**:
   - Indicates packets are dropped before reaching the SSH daemon.
   - Check local firewall rules (\`sudo ufw status\` or \`sudo iptables -L -n\`).
   - If UFW blocked port 22, allow it: \`sudo ufw allow 22/tcp\`.
   - Check if Fail2Ban has banned your current client IP: \`sudo fail2ban-client status sshd\`.
   - To unban: \`sudo fail2ban-client set sshd unbanip <your-ip>\`.`,
      tags: JSON.stringify(["ssh", "port22", "connection-refused", "timeout", "vnc", "fail2ban"]),
      keywords: "ssh connection refused port 22 timeout sshd fail2ban ufw firewall vnc",
      isPublished: true,
      usageCount: 42,
      helpfulCount: 38,
      unhelpfulCount: 2,
    },
  });

  await prisma.knowledgeBaseArticle.upsert({
    where: { slug: "diagnosing-packet-loss-latency-mtr" },
    update: {},
    create: {
      title: "Diagnosing Packet Loss and Route Latency Using MTR",
      slug: "diagnosing-packet-loss-latency-mtr",
      category: "VPS_CONNECTIVITY",
      content: `### What is MTR?
MTR (My Traceroute) combines \`traceroute\` and \`ping\` into a single network diagnostic tool that tests every hop between your client and your VPS.

### Generating an MTR Report
1. On Linux/macOS:
   \`\`\`bash
   mtr --report --report-cycles 100 <server-ip>
   \`\`\`
2. On Windows:
   - Download WinMTR, enter your VPS IP, and let it run for 100 packets.
   
### How to Interpret the Output:
- **Last Hop Loss**: If packet loss only occurs on the final hop, it indicates either ICMP rate limiting on the VPS or DDoS filtering.
- **Mid-Route Loss without Last Hop Loss**: If an intermediate hop shows 20% loss but the subsequent hops show 0%, it is ICMP deprioritization and does NOT indicate packet drop.
- Forward the 100-cycle MTR report to our NetOps team for carrier transit rerouting if high latency starts at an upstream ISP hop.`,
      tags: JSON.stringify(["network", "packet-loss", "latency", "mtr", "traceroute", "ddos"]),
      keywords: "mtr ping packet loss latency lag timeout traceroute netops routing",
      isPublished: true,
      usageCount: 29,
      helpfulCount: 27,
      unhelpfulCount: 1,
    },
  });

  await prisma.knowledgeBaseArticle.upsert({
    where: { slug: "resolving-out-of-memory-oom-crashes" },
    update: {},
    create: {
      title: "Resolving Linux Out-Of-Memory (OOM) Crashes and High Load",
      slug: "resolving-out-of-memory-oom-crashes",
      category: "RESOURCES",
      content: `### Understanding the OOM Killer
When the Linux kernel runs out of physical RAM and swap space, it invokes \`oom_killer\` to terminate high-memory processes (such as MySQL, Node.js, or Java) to prevent total system freeze.

### How to Inspect OOM Events:
\`\`\`bash
sudo dmesg -T | grep -i -E "oom|killed process"
\`\`\`

### Temporary Fix - Adding Swap:
If your VPS does not have swap space enabled:
\`\`\`bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
\`\`\`

### Permanent Resolution:
Review memory-hungry daemons using \`htop\` or resize your VPS instance via our Dashboard VPS Calculator specs for additional dedicated RAM.`,
      tags: JSON.stringify(["oom", "ram", "memory", "swap", "load", "crash", "htop"]),
      keywords: "oom out of memory ram crash killed process swap swapfile memory leak",
      isPublished: true,
      usageCount: 18,
      helpfulCount: 16,
      unhelpfulCount: 0,
    },
  });

  // 5. AI Configuration
  const existingAi = await prisma.aiConfig.findFirst();
  if (!existingAi) {
    await prisma.aiConfig.create({
      data: {
        provider: "LOCAL_FALLBACK",
        modelName: "gemini-1.5-flash",
        temperature: 0.2,
        maxTokens: 1024,
        systemPrompt: `You are the official AI Technical Support Specialist for Cavrix Cloud.
Your mission is to provide accurate, concise, and helpful troubleshooting for VPS hosting customers.

GUARDRAILS:
1. NEVER request customer passwords, private SSH keys, credit card details, or sensitive credentials.
2. NEVER claim you accessed a customer's VPS server or ran commands on their machine unless a verified API integration is active.
3. NEVER fabricate performance metrics, imaginary IPs, or fictitious server statuses.
4. Always consult approved Knowledge Base articles first.
5. Provide standard command-line diagnostic steps for Linux (Ubuntu, Debian, AlmaLinux, Rocky) and Windows Server.
6. When customer requests a human, expresses frustration, or the issue involves hardware failure/transit outages, escalate gracefully to human staff.`,
        guardrailsEnabled: true,
        autoTroubleshootSsh: true,
        autoTroubleshootFirewall: true,
        autoTroubleshootResources: true,
        forbidServerCredentialRequests: true,
        monthlyTokenLimit: 500000,
        tokensUsedThisMonth: 12450,
        fallbackEnabled: true,
      },
    });
  }

  // 6. Hosting Calculator Config
  const existingCalc = await prisma.hostingCalculatorConfig.findFirst();
  if (!existingCalc) {
    await prisma.hostingCalculatorConfig.create({
      data: {
        name: "Enterprise VPS Pricing Model",
        basePrice: 5.0,
        cpuCorePrice: 2.5,
        ramGbPrice: 1.5,
        nvmeGbPrice: 0.1,
        bandwidthTbPrice: 1.0,
        ipv4Price: 2.0,
        ddosTierPrice: JSON.stringify({
          standard: 0,
          advanced: 12,
          enterprise: 35,
        }),
        backupTierPrice: JSON.stringify({
          none: 0,
          weekly: 4,
          daily: 8,
        }),
        formulaExpression: "base + (cpu * cpuPrice) + (ram * ramPrice) + (nvme * nvmePrice) + (bw * bwPrice) + (ip * ipPrice) + ddos + backup",
        currency: "USD",
        isActive: true,
      },
    });
  }

  // 7. Visual Embed Templates
  await prisma.embedTemplate.upsert({
    where: { id: "tpl-cavrix-verify-001" },
    update: {},
    create: {
      id: "tpl-cavrix-verify-001",
      name: "Cavrix Cloud Verification Panel",
      description: "Official server verification embed matching # 🔒-VERIFY-HERE",
      title: "Welcome to Cavrix Cloud",
      embedDescription: "This server requires you to verify yourself to get access to other channels, you can simply verify by clicking on the verify button.",
      color: "#0084FF",
      authorName: "Security",
      footerText: "Cavrix Cloud Security System • Click Verify Below",
      hasTimestamp: true,
      fields: JSON.stringify([
        { name: "Server", value: "Cavrix Cloud (`CVRX`)", inline: true },
        { name: "Status", value: "Protected • 24/7 Online", inline: true },
        { name: "Access", value: "Click [Verify] below to unlock channels", inline: false },
      ]),
    },
  });

  await prisma.embedTemplate.upsert({
    where: { id: "tpl-maintenance-001" },
    update: {},
    create: {
      id: "tpl-maintenance-001",
      name: "Scheduled Node Maintenance",
      description: "Notify users of kernel upgrades and node reboot maintenance windows",
      title: "🛠️ Scheduled Maintenance Notice - Frankfurt DC02",
      embedDescription: "We will be performing mandatory hypervisor kernel patching and network switch firmware updates. Expected downtime per VPS is under 5 minutes.",
      color: "#0084FF",
      authorName: "Cavrix Cloud Infrastructure",
      authorIconUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=64&h=64&fit=crop",
      footerText: "Cavrix Cloud Operations • SLA Protected",
      hasTimestamp: true,
      fields: JSON.stringify([
        { name: "Node Range", value: "FRA-CVRX-01 through FRA-CVRX-08", inline: true },
        { name: "Maintenance Window", value: "Oct 28, 02:00 - 04:00 UTC", inline: true },
        { name: "Expected Impact", value: "Brief warm reboot (approx 120s)", inline: true },
        { name: "Live Status Page", value: "https://status.cavrix.cloud", inline: false },
      ]),
    },
  });

  await prisma.embedTemplate.upsert({
    where: { id: "tpl-welcome-guide-002" },
    update: {},
    create: {
      id: "tpl-welcome-guide-002",
      name: "VPS Getting Started Guide",
      description: "Embed sent to newly provisioned VPS owners",
      title: "🚀 Welcome to Cavrix Cloud",
      embedDescription: "Your enterprise KVM instance is provisioned and ready for SSH connection. Follow these best security practices to protect your instance.",
      color: "#00A3FF",
      authorName: "Cavrix Onboarding Team",
      footerText: "Need assistance? Click Open Ticket below.",
      hasTimestamp: true,
      fields: JSON.stringify([
        { name: "Default SSH Port", value: "`22` (TCP)", inline: true },
        { name: "Recommended Firewall", value: "`ufw` or `nftables`", inline: true },
        { name: "Console Access", value: "Emergency HTML5 VNC Console", inline: true },
        { name: "Security Checklist", value: "• Disable root password auth\n• Use Ed25519 SSH keys\n• Enable Fail2Ban", inline: false },
      ]),
    },
  });

  // 8. Sample Tickets & Conversations
  const ticket1 = await prisma.ticket.upsert({
    where: { ticketNumber: 1001 },
    update: {},
    create: {
      ticketNumber: 1001,
      title: "Cannot connect via SSH - Port 22 Connection Refused",
      categoryId: catSsh.id,
      customerDiscordId: "200000000000000001",
      customerUsername: "DevOps_Dan",
      customerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=128&h=128&fit=crop",
      channelId: "991000000000000001",
      status: "OPEN",
      priority: "HIGH",
      assignedStaffId: agentStaff.id,
      claimedAt: new Date(Date.now() - 3600000 * 2),
      messages: {
        create: [
          {
            senderDiscordId: "200000000000000001",
            senderUsername: "DevOps_Dan",
            isStaff: false,
            content: "Hi! I just restarted my VPS from the control panel and now running `ssh root@192.0.2.45` says `ssh: connect to host 192.0.2.45 port 22: Connection refused`. Can you help me check if SSH is running?",
            createdAt: new Date(Date.now() - 3600000 * 2),
          },
          {
            senderDiscordId: "999999999999999999",
            senderUsername: "Cavrix AI Assistant",
            isStaff: false,
            isBot: true,
            isAi: true,
            content: "Hello @DevOps_Dan! `Connection refused` usually indicates that your server is online, but the SSH daemon (`sshd`) has stopped or is listening on a different port. Here are 2 recommended diagnostic steps:\n1. Open your emergency VNC Web Console and log in.\n2. Run: `sudo systemctl status sshd`\n3. If it is stopped, run `sudo systemctl restart sshd` and check `sudo journalctl -u sshd -n 20` for configuration errors.\nDid you recently edit `/etc/ssh/sshd_config`?",
            createdAt: new Date(Date.now() - 3600000 * 1.9),
          },
          {
            senderDiscordId: "200000000000000001",
            senderUsername: "DevOps_Dan",
            isStaff: false,
            content: "I checked via VNC and it says `sshd.service: Failed with result 'exit-code'`. I think I made a syntax typo in sshd_config port definition. Let me fix it.",
            createdAt: new Date(Date.now() - 3600000 * 1.5),
          },
        ],
      },
      internalNotes: {
        create: [
          {
            staffDiscordId: agentStaff.discordId,
            staffUsername: agentStaff.username,
            content: "User made a syntax error in sshd_config. Assisting via VNC fallback instructions. If user does not respond within 24h, auto-close.",
          },
        ],
      },
    },
  });

  const ticket2 = await prisma.ticket.upsert({
    where: { ticketNumber: 1002 },
    update: {},
    create: {
      ticketNumber: 1002,
      title: "Severe packet loss on Frankfurt Node 4",
      categoryId: catNetwork.id,
      customerDiscordId: "200000000000000002",
      customerUsername: "HostMaster_Elena",
      channelId: "991000000000000002",
      status: "AWAITING_STAFF",
      priority: "URGENT",
      escalationReason: "Customer ran MTR showing 40% transit packet loss and requested human NetOps escalation.",
      escalatedAt: new Date(Date.now() - 1800000),
      assignedStaffId: leadStaff.id,
      messages: {
        create: [
          {
            senderDiscordId: "200000000000000002",
            senderUsername: "HostMaster_Elena",
            isStaff: false,
            content: "We are monitoring severe packet loss (40%) to our VPS at 198.51.100.82 from Level3 transit. Here is our 100-packet MTR report showing loss starting at the Telia edge router.",
            createdAt: new Date(Date.now() - 3600000),
          },
          {
            senderDiscordId: "999999999999999999",
            senderUsername: "Cavrix AI Assistant",
            isStaff: false,
            isBot: true,
            isAi: true,
            content: "Thank you for the detailed MTR output @HostMaster_Elena. Because this involves carrier transit routing on our Frankfurt BGP edge, I am escalating this ticket immediately to our NetOps Staff Lead.",
            createdAt: new Date(Date.now() - 1800000),
          },
        ],
      },
      internalNotes: {
        create: [
          {
            staffDiscordId: leadStaff.discordId,
            staffUsername: leadStaff.username,
            content: "NetOps contacted Telia NOC ticket #TEL-99824. Transit re-routed over DE-CIX secondary peering link.",
          },
        ],
      },
    },
  });

  const ticket3 = await prisma.ticket.upsert({
    where: { ticketNumber: 1003 },
    update: {},
    create: {
      ticketNumber: 1003,
      title: "Invoice query for additional IPv4 block",
      categoryId: catBilling.id,
      customerDiscordId: "200000000000000003",
      customerUsername: "Kev_ByteCloud",
      channelId: "991000000000000003",
      status: "RESOLVED",
      priority: "LOW",
      assignedStaffId: adminStaff.id,
      claimedAt: new Date(Date.now() - 86400000 * 2),
      resolvedAt: new Date(Date.now() - 86400000),
      resolutionSummary: "Added 2 additional static IPv4 addresses to user subscription and pro-rated next cycle.",
      customerFeedbackRating: 5,
      customerFeedbackComment: "Super fast and transparent billing adjustment!",
      messages: {
        create: [
          {
            senderDiscordId: "200000000000000003",
            senderUsername: "Kev_ByteCloud",
            isStaff: false,
            content: "Can I add 2 more dedicated IPv4 addresses to my instance? What will be the monthly invoice change?",
            createdAt: new Date(Date.now() - 86400000 * 2),
          },
          {
            senderDiscordId: adminStaff.discordId,
            senderUsername: adminStaff.username,
            isStaff: true,
            content: "Hello Kev! Dedicated IPv4 addresses are $2.00/month each. I have provisioned the two IPs and updated your next invoice.",
            createdAt: new Date(Date.now() - 86400000 * 1.5),
          },
          {
            senderDiscordId: "200000000000000003",
            senderUsername: "Kev_ByteCloud",
            isStaff: false,
            content: "Awesome, thank you so much! All set.",
            createdAt: new Date(Date.now() - 86400000),
          },
        ],
      },
      transcript: {
        create: {
          markdownContent: "# Ticket #1003 Transcript: Invoice query for additional IPv4 block\n- Customer: Kev_ByteCloud\n- Staff: Alex_Admin\n- Status: RESOLVED (5/5 Stars)",
          htmlContent: "<h1>Ticket #1003 Transcript</h1><p>Customer: Kev_ByteCloud</p><p>Staff: Alex_Admin</p><p>Status: RESOLVED</p>",
          messageCount: 3,
          staffCount: 1,
          firstResponseMinutes: 12,
          durationMinutes: 45,
        },
      },
    },
  });

  // 9. Initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorDiscordId: adminStaff.discordId,
        actorUsername: adminStaff.username,
        action: "CONFIG_UPDATE",
        targetType: "GUILD_CONFIG",
        targetId: "123456789012345678",
        details: JSON.stringify({ changes: { enableAiSupport: true, maxTicketsPerUser: 3 } }),
      },
      {
        actorDiscordId: leadStaff.discordId,
        actorUsername: leadStaff.username,
        action: "TICKET_ESCALATE",
        targetType: "TICKET",
        targetId: ticket2.id,
        details: JSON.stringify({ reason: "NetOps transit degradation reported" }),
      },
      {
        actorDiscordId: agentStaff.discordId,
        actorUsername: agentStaff.username,
        action: "TICKET_CLAIM",
        targetType: "TICKET",
        targetId: ticket1.id,
        details: JSON.stringify({ ticketNumber: 1001 }),
      },
      {
        actorDiscordId: adminStaff.discordId,
        actorUsername: adminStaff.username,
        action: "TICKET_RESOLVE",
        targetType: "TICKET",
        targetId: ticket3.id,
        details: JSON.stringify({ resolution: "Added 2 additional static IPv4 addresses" }),
      },
    ],
  });

  console.log("✅ Seed completed successfully with realistic VPS hosting data!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
