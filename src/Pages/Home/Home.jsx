import React from 'react'
import HeroSection from './HeroSection/HeroSection'
import About from './About/About'
import Products from './Products/Products'
import CtaSection from './Cta/CtaSection'
import ImagesSection from './Images/ImagesSection'
import ShowCase from './Showcase/ShowCase'

const Home = () => {
  return (
    <>
      <HeroSection />
      <About />
      <Products />
      <CtaSection />
      <ImagesSection />
      <ShowCase />
    </>
  )
}

export default Home