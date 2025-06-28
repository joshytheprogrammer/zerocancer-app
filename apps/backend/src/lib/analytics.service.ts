import { PrismaClient } from "@prisma/client";

export interface AdminDashboardMetrics {
  // Financial Metrics
  totalRevenue: number;
  monthlyRevenue: number;
  averageTransactionValue: number;

  // User Metrics
  totalUsers: number;
  newUsersThisMonth: number;
  activePatients: number;
  activeDonors: number;

  // Appointment Metrics
  totalAppointments: number;
  completedAppointments: number;
  pendingAppointments: number;
  appointmentCompletionRate: number;

  // Campaign Metrics
  activeCampaigns: number;
  totalDonationAmount: number;
  averageCampaignFunding: number;

  // Center Metrics
  activeCenters: number;
  centerUtilizationRate: number;

  // Waitlist Metrics
  totalWaitlistUsers: number;
  averageWaitTime: number;
  matchingSuccessRate: number;
}

export interface TimeBasedReport {
  period: "daily" | "weekly" | "monthly" | "yearly";
  dateRange: { from: Date; to: Date };

  // Revenue tracking
  revenueByDay: Array<{ date: string; amount: number }>;
  appointmentsByDay: Array<{ date: string; count: number }>;
  registrationsByDay: Array<{ date: string; count: number }>;

  // Growth metrics
  userGrowthRate: number;
  revenueGrowthRate: number;
  appointmentGrowthRate: number;
}

export interface GeographicReport {
  usersByState: Array<{ state: string; count: number }>;
  centersByState: Array<{ state: string; count: number }>;
  appointmentsByState: Array<{ state: string; count: number }>;
  revenueByState: Array<{ state: string; amount: number }>;

  // Hot zones for waitlist
  waitlistHotZones: Array<{
    state: string;
    waitlistCount: number;
    averageWaitTime: number;
  }>;
}

export interface CenterPerformanceReport {
  centerId: string;
  centerName: string;

  // Performance metrics
  totalAppointments: number;
  completedAppointments: number;
  completionRate: number;
  averageRating: number;

  // Financial metrics
  totalRevenue: number;
  averageAppointmentValue: number;
  payoutsPending: number;

  // Efficiency metrics
  averageProcessingTime: number;
  resultUploadRate: number;
}

export interface CampaignAnalytics {
  campaignId: string;
  title: string;

  // Funding metrics
  targetAmount: number;
  currentAmount: number;
  fundingPercentage: number;
  donorCount: number;
  averageDonation: number;

  // Usage metrics
  patientsMatched: number;
  appointmentsCompleted: number;
  utilizationRate: number;

  // Time metrics
  daysSinceCreated: number;
  estimatedDepletion: number | null;
}

export class AnalyticsService {
  constructor(private prisma: PrismaClient) {}

  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalUsers,
      newUsersThisMonth,
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      activeCampaigns,
      activeCenters,
      totalWaitlistUsers,
      totalRevenue,
      monthlyRevenue,
      totalDonationAmount,
    ] = await Promise.all([
      // User metrics
      this.prisma.user.count(),
      this.prisma.user.count({
        where: { createdAt: { gte: startOfMonth } },
      }),

      // Appointment metrics
      this.prisma.appointment.count(),
      this.prisma.appointment.count({
        where: { status: "COMPLETED" },
      }),
      this.prisma.appointment.count({
        where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      }),

      // Campaign metrics
      this.prisma.donationCampaign.count({
        where: { status: "ACTIVE" },
      }),

      // Center metrics
      this.prisma.serviceCenter.count({
        where: { status: "ACTIVE" },
      }),

      // Waitlist metrics
      this.prisma.waitlist.count({
        where: { status: "PENDING" },
      }),

      // Financial metrics
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { status: "COMPLETED" },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: { gte: startOfMonth },
        },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: "DONATION" },
      }),
    ]);

    // Calculate derived metrics
    const appointmentCompletionRate =
      totalAppointments > 0
        ? (completedAppointments / totalAppointments) * 100
        : 0;

    const averageTransactionValue = await this.getAverageTransactionValue();
    const activePatients = await this.getActivePatients();
    const activeDonors = await this.getActiveDonors();
    const averageCampaignFunding = await this.getAverageCampaignFunding();
    const centerUtilizationRate = await this.getCenterUtilizationRate();
    const averageWaitTime = await this.getAverageWaitTime();
    const matchingSuccessRate = await this.getMatchingSuccessRate();

    return {
      // Financial Metrics
      totalRevenue: Number(totalRevenue._sum.amount) || 0,
      monthlyRevenue: Number(monthlyRevenue._sum.amount) || 0,
      averageTransactionValue,

      // User Metrics
      totalUsers,
      newUsersThisMonth,
      activePatients,
      activeDonors,

      // Appointment Metrics
      totalAppointments,
      completedAppointments,
      pendingAppointments,
      appointmentCompletionRate,

      // Campaign Metrics
      activeCampaigns,
      totalDonationAmount: Number(totalDonationAmount._sum.amount) || 0,
      averageCampaignFunding,

      // Center Metrics
      activeCenters,
      centerUtilizationRate,

      // Waitlist Metrics
      totalWaitlistUsers,
      averageWaitTime,
      matchingSuccessRate,
    };
  }

  async getTimeBasedReport(
    period: "daily" | "weekly" | "monthly" | "yearly",
    dateRange: { from: Date; to: Date }
  ): Promise<TimeBasedReport> {
    const { from, to } = dateRange;

    // Get revenue by day
    const revenueByDay = await this.getRevenueByPeriod(period, from, to);

    // Get appointments by day
    const appointmentsByDay = await this.getAppointmentsByPeriod(
      period,
      from,
      to
    );

    // Get registrations by day
    const registrationsByDay = await this.getRegistrationsByPeriod(
      period,
      from,
      to
    );

    // Calculate growth rates
    const userGrowthRate = await this.calculateUserGrowthRate(from, to);
    const revenueGrowthRate = await this.calculateRevenueGrowthRate(from, to);
    const appointmentGrowthRate = await this.calculateAppointmentGrowthRate(
      from,
      to
    );

    return {
      period,
      dateRange,
      revenueByDay,
      appointmentsByDay,
      registrationsByDay,
      userGrowthRate,
      revenueGrowthRate,
      appointmentGrowthRate,
    };
  }

  async getGeographicReport(): Promise<GeographicReport> {
    const [
      usersByState,
      centersByState,
      appointmentsByState,
      revenueByState,
      waitlistHotZones,
    ] = await Promise.all([
      this.getUsersByState(),
      this.getCentersByState(),
      this.getAppointmentsByState(),
      this.getRevenueByState(),
      this.getWaitlistHotZones(),
    ]);

    return {
      usersByState,
      centersByState,
      appointmentsByState,
      revenueByState,
      waitlistHotZones,
    };
  }

  async getCenterPerformanceReport(
    centerId?: string
  ): Promise<CenterPerformanceReport[]> {
    const whereClause = centerId ? { id: centerId } : {};

    const centers = await this.prisma.serviceCenter.findMany({
      where: whereClause,
      include: {
        appointments: {
          include: {
            transaction: true,
          },
        },
      },
    });

    return Promise.all(
      centers.map(async (center) => {
        const totalAppointments = center.appointments.length;
        const completedAppointments = center.appointments.filter(
          (app) => app.status === "COMPLETED"
        ).length;

        const totalRevenue = center.appointments.reduce((sum, app) => {
          return sum + (app.transaction ? Number(app.transaction.amount) : 0);
        }, 0);

        const completionRate =
          totalAppointments > 0
            ? (completedAppointments / totalAppointments) * 100
            : 0;

        const averageAppointmentValue =
          totalAppointments > 0 ? totalRevenue / totalAppointments : 0;

        // Additional metrics
        const averageRating = 4.5; // Placeholder - implement rating system
        const payoutsPending = 0; // Placeholder - implement payout system
        const averageProcessingTime = 24; // Placeholder - hours
        const resultUploadRate = 95; // Placeholder - percentage

        return {
          centerId: center.id,
          centerName: center.centerName,
          totalAppointments,
          completedAppointments,
          completionRate,
          averageRating,
          totalRevenue,
          averageAppointmentValue,
          payoutsPending,
          averageProcessingTime,
          resultUploadRate,
        };
      })
    );
  }

  async getCampaignAnalytics(): Promise<CampaignAnalytics[]> {
    const campaigns = await this.prisma.donationCampaign.findMany({
      include: {
        transactions: true,
        allocations: {
          include: {
            appointment: true,
          },
        },
      },
    });

    return campaigns.map((campaign) => {
      const targetAmount = Number(campaign.initialAmount);
      const currentAmount = campaign.transactions.reduce(
        (sum: number, transaction) => sum + Number(transaction.amount),
        0
      );

      const fundingPercentage =
        targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;
      const donorCount = new Set(campaign.transactions.map((t) => t.id)).size; // Using transaction count as proxy
      const averageDonation = donorCount > 0 ? currentAmount / donorCount : 0;

      const patientsMatched = campaign.allocations.length;
      const appointmentsCompleted = campaign.allocations.filter(
        (allocation) => allocation.appointment?.status === "COMPLETED"
      ).length;

      const utilizationRate =
        patientsMatched > 0
          ? (appointmentsCompleted / patientsMatched) * 100
          : 0;

      const daysSinceCreated = Math.floor(
        (Date.now() - campaign.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Estimate depletion based on current usage rate (simplified)
      const estimatedDepletion =
        utilizationRate > 0
          ? Math.floor(currentAmount / (appointmentsCompleted * 100))
          : null;

      return {
        campaignId: campaign.id,
        title: campaign.purpose || "Donation Campaign",
        targetAmount,
        currentAmount,
        fundingPercentage,
        donorCount,
        averageDonation,
        patientsMatched,
        appointmentsCompleted,
        utilizationRate,
        daysSinceCreated,
        estimatedDepletion,
      };
    });
  }

  // Helper methods
  private async getAverageTransactionValue(): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      _avg: { amount: true },
      where: { status: "COMPLETED" },
    });
    return Number(result._avg?.amount) || 0;
  }

  private async getActivePatients(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.prisma.user.count({
      where: {
        patientProfile: { isNot: null },
        appointments: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    });
  }

  private async getActiveDonors(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return await this.prisma.user.count({
      where: {
        donorProfile: { isNot: null },
        donationCampaigns: {
          some: {
            createdAt: { gte: thirtyDaysAgo },
          },
        },
      },
    });
  }

  private async getAverageCampaignFunding(): Promise<number> {
    const campaigns = await this.prisma.donationCampaign.findMany({
      include: {
        transactions: true,
      },
    });

    if (campaigns.length === 0) return 0;

    const totalFunding = campaigns.reduce((sum, campaign) => {
      const campaignFunding = campaign.transactions.reduce(
        (campaignSum: number, transaction) =>
          campaignSum + Number(transaction.amount),
        0
      );
      return sum + campaignFunding;
    }, 0);

    return totalFunding / campaigns.length;
  }

  private async getCenterUtilizationRate(): Promise<number> {
    const totalCenters = await this.prisma.serviceCenter.count();
    const centersWithAppointments = await this.prisma.serviceCenter.count({
      where: {
        appointments: {
          some: {},
        },
      },
    });

    return totalCenters > 0
      ? (centersWithAppointments / totalCenters) * 100
      : 0;
  }

  private async getAverageWaitTime(): Promise<number> {
    const waitlistEntries = await this.prisma.waitlist.findMany({
      where: {
        status: "MATCHED",
        claimedAt: { not: null },
      },
    });

    if (waitlistEntries.length === 0) return 0;

    const totalWaitTime = waitlistEntries.reduce((sum: number, entry) => {
      if (entry.claimedAt) {
        const waitTime = entry.claimedAt.getTime() - entry.joinedAt.getTime();
        return sum + waitTime;
      }
      return sum;
    }, 0);

    // Convert to days
    return totalWaitTime / (waitlistEntries.length * 1000 * 60 * 60 * 24);
  }

  private async getMatchingSuccessRate(): Promise<number> {
    const totalWaitlistEntries = await this.prisma.waitlist.count();
    const matchedEntries = await this.prisma.waitlist.count({
      where: { status: "MATCHED" },
    });

    return totalWaitlistEntries > 0
      ? (matchedEntries / totalWaitlistEntries) * 100
      : 0;
  }

  // Time-based report helpers
  private async getRevenueByPeriod(
    period: string,
    from: Date,
    to: Date
  ): Promise<Array<{ date: string; amount: number }>> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        status: "COMPLETED",
        createdAt: { gte: from, lte: to },
      },
    });

    const groupedData = new Map<string, number>();

    transactions.forEach((transaction) => {
      const date = transaction.createdAt.toISOString().split("T")[0];
      const amount = Number(transaction.amount);
      groupedData.set(date, (groupedData.get(date) || 0) + amount);
    });

    return Array.from(groupedData.entries())
      .map(([date, amount]) => ({
        date,
        amount,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getAppointmentsByPeriod(
    period: string,
    from: Date,
    to: Date
  ): Promise<Array<{ date: string; count: number }>> {
    const appointments = await this.prisma.appointment.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
    });

    const groupedData = new Map<string, number>();

    appointments.forEach((appointment) => {
      const date = appointment.createdAt.toISOString().split("T")[0];
      groupedData.set(date, (groupedData.get(date) || 0) + 1);
    });

    return Array.from(groupedData.entries())
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private async getRegistrationsByPeriod(
    period: string,
    from: Date,
    to: Date
  ): Promise<Array<{ date: string; count: number }>> {
    const users = await this.prisma.user.findMany({
      where: {
        createdAt: { gte: from, lte: to },
      },
    });

    const groupedData = new Map<string, number>();

    users.forEach((user) => {
      const date = user.createdAt.toISOString().split("T")[0];
      groupedData.set(date, (groupedData.get(date) || 0) + 1);
    });

    return Array.from(groupedData.entries())
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  // Growth rate calculations
  private async calculateUserGrowthRate(from: Date, to: Date): Promise<number> {
    const previousPeriodStart = new Date(from);
    const periodLength = to.getTime() - from.getTime();
    previousPeriodStart.setTime(from.getTime() - periodLength);

    const [currentPeriodUsers, previousPeriodUsers] = await Promise.all([
      this.prisma.user.count({
        where: { createdAt: { gte: from, lte: to } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: previousPeriodStart, lte: from } },
      }),
    ]);

    return previousPeriodUsers > 0
      ? ((currentPeriodUsers - previousPeriodUsers) / previousPeriodUsers) * 100
      : 0;
  }

  private async calculateRevenueGrowthRate(
    from: Date,
    to: Date
  ): Promise<number> {
    const previousPeriodStart = new Date(from);
    const periodLength = to.getTime() - from.getTime();
    previousPeriodStart.setTime(from.getTime() - periodLength);

    const [currentRevenue, previousRevenue] = await Promise.all([
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: { gte: from, lte: to },
        },
      }),
      this.prisma.transaction.aggregate({
        _sum: { amount: true },
        where: {
          status: "COMPLETED",
          createdAt: { gte: previousPeriodStart, lte: from },
        },
      }),
    ]);

    const current = Number(currentRevenue._sum?.amount) || 0;
    const previous = Number(previousRevenue._sum?.amount) || 0;

    return previous > 0 ? ((current - previous) / previous) * 100 : 0;
  }

  private async calculateAppointmentGrowthRate(
    from: Date,
    to: Date
  ): Promise<number> {
    const previousPeriodStart = new Date(from);
    const periodLength = to.getTime() - from.getTime();
    previousPeriodStart.setTime(from.getTime() - periodLength);

    const [currentPeriodAppointments, previousPeriodAppointments] =
      await Promise.all([
        this.prisma.appointment.count({
          where: { createdAt: { gte: from, lte: to } },
        }),
        this.prisma.appointment.count({
          where: { createdAt: { gte: previousPeriodStart, lte: from } },
        }),
      ]);

    return previousPeriodAppointments > 0
      ? ((currentPeriodAppointments - previousPeriodAppointments) /
          previousPeriodAppointments) *
          100
      : 0;
  }

  // Geographic report helpers
  private async getUsersByState(): Promise<
    Array<{ state: string; count: number }>
  > {
    const users = await this.prisma.user.findMany({
      include: {
        patientProfile: { select: { state: true } },
      },
    });

    const stateCount = new Map<string, number>();
    users.forEach((user) => {
      const state = user.patientProfile?.state;
      if (state) {
        stateCount.set(state, (stateCount.get(state) || 0) + 1);
      }
    });

    return Array.from(stateCount.entries()).map(([state, count]) => ({
      state,
      count,
    }));
  }

  private async getCentersByState(): Promise<
    Array<{ state: string; count: number }>
  > {
    const centers = await this.prisma.serviceCenter.findMany({
      select: { state: true },
    });

    const stateCount = new Map<string, number>();
    centers.forEach((center) => {
      if (center.state) {
        stateCount.set(center.state, (stateCount.get(center.state) || 0) + 1);
      }
    });

    return Array.from(stateCount.entries()).map(([state, count]) => ({
      state,
      count,
    }));
  }

  private async getAppointmentsByState(): Promise<
    Array<{ state: string; count: number }>
  > {
    const appointments = await this.prisma.appointment.findMany({
      include: {
        center: { select: { state: true } },
      },
    });

    const stateCount = new Map<string, number>();
    appointments.forEach((appointment) => {
      if (appointment.center.state) {
        stateCount.set(
          appointment.center.state,
          (stateCount.get(appointment.center.state) || 0) + 1
        );
      }
    });

    return Array.from(stateCount.entries()).map(([state, count]) => ({
      state,
      count,
    }));
  }

  private async getRevenueByState(): Promise<
    Array<{ state: string; amount: number }>
  > {
    const transactions = await this.prisma.transaction.findMany({
      where: { status: "COMPLETED" },
      include: {
        appointments: {
          include: {
            center: { select: { state: true } },
          },
        },
      },
    });

    const stateRevenue = new Map<string, number>();
    transactions.forEach((transaction) => {
      if (transaction.appointments && transaction.appointments.length > 0) {
        const state = transaction.appointments[0].center.state;
        if (state) {
          stateRevenue.set(
            state,
            (stateRevenue.get(state) || 0) + Number(transaction.amount)
          );
        }
      }
    });

    return Array.from(stateRevenue.entries()).map(([state, amount]) => ({
      state,
      amount,
    }));
  }

  private async getWaitlistHotZones(): Promise<
    Array<{
      state: string;
      waitlistCount: number;
      averageWaitTime: number;
    }>
  > {
    const waitlistEntries = await this.prisma.waitlist.findMany({
      include: {
        patient: {
          include: {
            patientProfile: { select: { state: true } },
          },
        },
      },
    });

    const stateData = new Map<
      string,
      { count: number; totalWaitTime: number; matched: number }
    >();

    waitlistEntries.forEach((entry) => {
      const state = entry.patient.patientProfile?.state;
      if (state) {
        const data = stateData.get(state) || {
          count: 0,
          totalWaitTime: 0,
          matched: 0,
        };
        data.count += 1;

        if (entry.status === "MATCHED" && entry.claimedAt) {
          data.matched += 1;
          data.totalWaitTime +=
            entry.claimedAt.getTime() - entry.joinedAt.getTime();
        }

        stateData.set(state, data);
      }
    });

    return Array.from(stateData.entries()).map(([state, data]) => ({
      state,
      waitlistCount: data.count,
      averageWaitTime:
        data.matched > 0
          ? data.totalWaitTime / (data.matched * 1000 * 60 * 60 * 24) // Convert to days
          : 0,
    }));
  }
}
