import React from 'react'
import HeroSection from './HeroSection/HeroSection'
import About from './About/About'
import Products from './Products/Products'
import ShowCase from './Showcase/ShowCase'
import AvailableOn from './Availiable/AvailableOn'
import Slider from './Slider/Slider'
import CustomerStories from './CustomerStories/CustomerStories'
import FooterTopPattern from '../../Components/Footer/FooterTopPattern/FooterTopPattern'

const Home = () => {

  return (
    <>
      <HeroSection />
      <About/>

      <Products />
      <AvailableOn/>
      <Slider/>
      <ShowCase/>
      <CustomerStories/>
      <FooterTopPattern/>
      
    </>
  )
}

export default Home