import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            {/* Hero Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="text-center mb-16">
                    <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6">
                        Take Control of Your
                        <span className="text-blue-600 dark:text-blue-400"> Finances</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
                        Track your accounts, investments, debts, and services all in one place.
                        Get insights into your financial health with powerful analytics and beautiful visualizations.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button asChild size="lg" className="text-lg px-8 py-3">
                            <Link href="/login">Get Started</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg" className="text-lg px-8 py-3">
                            <Link href="/login">Sign In</Link>
                        </Button>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="h-8 w-8 text-2xl mr-3">💰</div>
                            <h3 className="text-xl font-semibold">Account Management</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Track multiple bank accounts, savings, and cash holdings across different currencies.
                        </p>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="h-8 w-8 text-2xl mr-3">📈</div>
                            <h3 className="text-xl font-semibold">Investment Tracking</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Monitor your investments with performance analytics, value history, and gain/loss calculations.
                        </p>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="h-8 w-8 text-2xl mr-3">💳</div>
                            <h3 className="text-xl font-semibold">Debt Management</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Keep track of debts, loans, and money owed with payment tracking and status monitoring.
                        </p>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="h-8 w-8 text-2xl mr-3">📊</div>
                            <h3 className="text-xl font-semibold">Visual Analytics</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Beautiful charts and graphs to visualize your financial distribution and trends.
                        </p>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="h-8 w-8 text-2xl mr-3">🌍</div>
                            <h3 className="text-xl font-semibold">Multi-Currency Support</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Handle multiple currencies with automatic grouping and conversion tracking.
                        </p>
                    </Card>

                    <Card className="p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-center mb-4">
                            <div className="h-8 w-8 text-2xl mr-3">🔒</div>
                            <h3 className="text-xl font-semibold">Secure & Private</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                            Your financial data is encrypted and secure. Only you have access to your information.
                        </p>
                    </Card>
                </div>

                {/* Key Benefits Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg p-8 shadow-lg">
                    <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
                        Why Choose Our Finance Tracker?
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                📊 Comprehensive Overview
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Get a complete picture of your financial situation with accounts, investments,
                                debts, and recurring services all in one dashboard.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                🎯 Smart Organization
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Automatically group similar accounts, track payment statuses,
                                and organize your finances intelligently.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                📈 Growth Tracking
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Monitor investment performance, track debt payments,
                                and visualize your financial progress over time.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                                🌙 Beautiful Interface
                            </h4>
                            <p className="text-gray-600 dark:text-gray-300 mb-4">
                                Enjoy a clean, modern interface with dark mode support
                                and responsive design that works on all devices.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Call to Action */}
                <div className="text-center mt-16">
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                        Ready to Take Control?
                    </h2>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
                        Join thousands of users who have simplified their financial management.
                    </p>
                    <Button asChild size="lg" className="text-lg px-12 py-4">
                        <Link href="/login">Start Your Financial Journey</Link>
                    </Button>
                </div>
            </div>
        </div>
    );
}
