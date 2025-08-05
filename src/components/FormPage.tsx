import React from 'react';
import { Header } from './Header';
import FormContainer from './forms/FormContainer';

export default function FormPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header showCTA={false} />
      
      <main className="flex-grow pt-16 pb-20">
        <section className="py-8 bg-gray-50 min-h-[calc(100vh-10rem)]">
          <div className="w-full mx-auto">
            <FormContainer />
          </div>
        </section>
      </main>
      
      <footer className="bg-primary text-white py-6 fixed bottom-0 w-full z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Beacon House. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}