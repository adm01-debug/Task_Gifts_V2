import type { Meta, StoryObj } from '@storybook/react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Star, Zap, Trophy, Heart, Sparkles } from 'lucide-react';

const meta: Meta = {
  title: 'Animations/Framer Motion',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Animações e transições usando Framer Motion.',
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;

export const FadeIn: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Fade In</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="p-6 bg-primary/20 rounded-lg text-center"
        >
          <p className="text-lg font-medium">Elemento com Fade In</p>
        </motion.div>
      </CardContent>
    </Card>
  ),
};

export const SlideUp: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Slide Up</CardTitle>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="p-6 bg-primary/20 rounded-lg text-center"
        >
          <p className="text-lg font-medium">Elemento com Slide Up</p>
        </motion.div>
      </CardContent>
    </Card>
  ),
};

export const ScaleBounce: StoryObj = {
  render: () => {
    const [key, setKey] = useState(0);
    
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Scale com Bounce</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            key={key}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20 
            }}
            className="w-32 h-32 bg-gradient-to-br from-primary to-primary/60 rounded-xl mx-auto flex items-center justify-center"
          >
            <Trophy className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          <div className="text-center">
            <Button onClick={() => setKey(k => k + 1)}>Repetir</Button>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const StaggeredList: StoryObj = {
  render: () => {
    const [key, setKey] = useState(0);
    const items = ['Item 1', 'Item 2', 'Item 3', 'Item 4', 'Item 5'];
    
    const container = {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    };
    
    const item = {
      hidden: { opacity: 0, x: -20 },
      show: { opacity: 1, x: 0 }
    };
    
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Lista Escalonada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.ul
            key={key}
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-2"
          >
            {items.map((text, index) => (
              <motion.li
                key={index}
                variants={item}
                className="p-4 bg-muted rounded-lg flex items-center gap-3"
              >
                <Star className="w-5 h-5 text-coins" />
                <span>{text}</span>
              </motion.li>
            ))}
          </motion.ul>
          <div className="text-center">
            <Button onClick={() => setKey(k => k + 1)}>Repetir</Button>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const HoverEffects: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Efeitos de Hover</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-6 bg-primary/20 rounded-lg text-center cursor-pointer"
          >
            <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Scale</p>
          </motion.div>
          
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 bg-xp/20 rounded-lg text-center cursor-pointer"
          >
            <Star className="w-8 h-8 mx-auto mb-2 text-xp" />
            <p className="text-sm font-medium">Lift</p>
          </motion.div>
          
          <motion.div
            whileHover={{ rotate: 5 }}
            className="p-6 bg-coins/20 rounded-lg text-center cursor-pointer"
          >
            <Heart className="w-8 h-8 mx-auto mb-2 text-coins" />
            <p className="text-sm font-medium">Rotate</p>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  ),
};

export const XPGainAnimation: StoryObj = {
  render: () => {
    const [show, setShow] = useState(false);
    
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Animação de XP Ganho</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative h-32 bg-muted/50 rounded-lg flex items-center justify-center">
            {show && (
              <motion.div
                initial={{ opacity: 0, y: 0, scale: 0.5 }}
                animate={{ opacity: [0, 1, 1, 0], y: -50, scale: 1 }}
                transition={{ duration: 1.5 }}
                onAnimationComplete={() => setShow(false)}
                className="absolute flex items-center gap-2 text-xp font-bold text-2xl"
              >
                <Sparkles className="w-6 h-6" />
                +150 XP
              </motion.div>
            )}
            <div className="text-muted-foreground">
              {!show && "Clique para simular ganho de XP"}
            </div>
          </div>
          <div className="text-center">
            <Button onClick={() => setShow(true)} disabled={show}>
              Ganhar XP
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const AchievementUnlock: StoryObj = {
  render: () => {
    const [show, setShow] = useState(false);
    
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Desbloqueio de Conquista</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative h-48 bg-gradient-to-br from-purple-900/20 to-pink-900/20 rounded-lg flex items-center justify-center overflow-hidden">
            {show && (
              <>
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ 
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  className="absolute"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/30">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="absolute bottom-6 text-center"
                >
                  <p className="text-lg font-bold">Conquista Desbloqueada!</p>
                  <p className="text-sm text-muted-foreground">Primeiro Login</p>
                </motion.div>

                {/* Particles */}
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, x: 0, y: 0 }}
                    animate={{ 
                      scale: [0, 1, 0],
                      x: Math.cos(i * 45 * Math.PI / 180) * 80,
                      y: Math.sin(i * 45 * Math.PI / 180) * 80
                    }}
                    transition={{ 
                      duration: 0.8,
                      delay: 0.2
                    }}
                    className="absolute w-3 h-3 bg-yellow-400 rounded-full"
                  />
                ))}
              </>
            )}
            {!show && (
              <p className="text-muted-foreground">Clique para ver a animação</p>
            )}
          </div>
          <div className="text-center">
            <Button onClick={() => setShow(!show)}>
              {show ? 'Resetar' : 'Desbloquear'}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  },
};

export const PulseGlow: StoryObj = {
  render: () => (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Pulse & Glow</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center gap-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 bg-primary rounded-full flex items-center justify-center"
          >
            <Heart className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(var(--xp), 0)",
                "0 0 0 20px rgba(var(--xp), 0.3)",
                "0 0 0 0 rgba(var(--xp), 0)"
              ]
            }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 bg-xp rounded-full flex items-center justify-center"
          >
            <Zap className="w-8 h-8 text-xp-foreground" />
          </motion.div>
          
          <motion.div
            animate={{ 
              opacity: [1, 0.5, 1]
            }}
            transition={{ 
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-16 h-16 bg-coins rounded-full flex items-center justify-center"
          >
            <Star className="w-8 h-8 text-coins-foreground" />
          </motion.div>
        </div>
      </CardContent>
    </Card>
  ),
};
