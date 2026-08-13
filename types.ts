export interface PortfolioItem {
  id: number;
  name: string;
  category: string;
  description: string;
  image: string;
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  bio: string;
  image: string;
}

export interface ProcessStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export enum SectionId {
  Home = 'home',
  Model = 'model',
  Portfolio = 'portfolio',
  Process = 'process',
  Team = 'team',
  Contact = 'contact'
}

export enum PageType {
  None = 'none',
  Company = 'company',
  FAQ = 'faq',
  Privacy = 'privacy',
  Terms = 'terms',
  Tokushoho = 'tokushoho'
}