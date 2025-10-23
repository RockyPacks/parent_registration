
import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Footer from './components/Footer';

const App: React.FC = () => {
  const [activeStep, setActiveStep] = useState(1);
  const steps = [
    { number: 1, title: 'Student & Guardian Info', subtitle: 'Personal details' },
    { number: 2, title: 'Document Upload', subtitle: 'Required documents' },
    { number: 3, title: 'Academic History', subtitle: 'Previous schools' },
    { number: 4, title: 'Subjects Selection', subtitle: 'Choose subjects' },
    { number: 5, title: 'Fee Agreement', subtitle: 'Payment terms' },
    { number: 6, title: 'Declaration', subtitle: 'Terms & conditions' },
    { number: 7, title: 'Review & Submit', subtitle: 'Final review' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto bg-white border border-gray-200 rounded-lg shadow-sm">
        <Header />
        <main className="flex flex-col md:flex-row border-t border-gray-200">
          <Sidebar steps={steps} activeStep={activeStep} />
          <div className="flex-1 flex flex-col">
            <MainContent />
            <Footer />
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
