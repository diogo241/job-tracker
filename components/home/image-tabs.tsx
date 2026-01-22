'use client';

import Image from 'next/image';
import { useState } from 'react';
import { Button } from '../ui/button';

const ImageTabs = () => {
  const [activeTab, setActiveTab] = useState('organize');

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex gap-2 justify-center mb-8">
        <Button
          className={`cursor-pointer rounded-lg px-6 py-3 text-sm transition-colors ${activeTab === 'organize' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('organize')}
        >
          Organize Applications
        </Button>
        <Button
          className={`cursor-pointer rounded-lg px-6 py-3 text-sm transition-colors ${activeTab === 'hired' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('hired')}
        >
          Get Hired
        </Button>
        <Button
          className={`cursor-pointer rounded-lg px-6 py-3 text-sm transition-colors ${activeTab === 'boards' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          onClick={() => setActiveTab('boards')}
        >
          Manage Boards
        </Button>
      </div>
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-lg border border-gray-200 shadow-xl">
        <Image
          src="/hero-images/hero1.png"
          alt="Organize Applications"
          className={activeTab === 'organize' ? 'block' : 'hidden'}
          width={1200}
          height={800}
        />
        <Image
          src="/hero-images/hero2.png"
          alt="Get Hired"
          className={activeTab === 'hired' ? 'block' : 'hidden'}
          width={1200}
          height={800}
        />
        <Image
          src="/hero-images/hero3.png"
          alt="Manage Boards"
          className={activeTab === 'boards' ? 'block' : 'hidden'}
          width={1200}
          height={800}
        />
      </div>
    </div>
  );
};

export default ImageTabs;
