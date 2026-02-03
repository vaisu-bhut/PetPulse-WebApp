"use client";

import LandingNavbar from '@/components/landing/LandingNavbar';
import LandingFooter from '@/components/landing/LandingFooter';
import HeroSection from '@/components/landing/HeroSection';
import FeaturesSection from '@/components/landing/FeaturesSection';
import WorkflowSection from '@/components/landing/WorkflowSection';

export default function LandingPage() {
    return (
        <div className="min-h-screen flex flex-col font-sans">
            <LandingNavbar />
            <main>
                <HeroSection />
                <FeaturesSection />
                <WorkflowSection />
            </main>
            <LandingFooter />
        </div>
    );
}
