'use client';

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card"
import { useSprings, animated, to as interpolate } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Loader2, Cat, RefreshCw } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";
import { toast } from "sonner";

type Cat = {
  id: string;
  tags: string[];
  mimetype: string;
  createdAt: string;
}

// Prepare the cards for the swipe functionality
const to = (i: number) => ({
  x: 0,
  y: i * -10,
  scale: 1,
  rot: 0,
  delay: i * 100,
});

const from = () => ({ x: 0, rot: 0, scale: 1.5, y: -1000 });

// When a card is swiped
const transform = (r: number, s: number) => 
  `perspective(1500px) rotateX(5deg) rotateY(${r / 10}deg) rotateZ(${r}deg) scale(${s})`;

const CatPage = () => {
  const [cats, setCats] = useState<Cat[]>([]);
  const [likeCats, setLikeCats] = useState<Cat[]>([]);
  const [dislikeCats, setDislikeCats] = useState<Cat[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [gone] = useState(() => new Set());
  const [progress, setProgress] = useState(0);

  const fetchCats = async () => {
    setIsLoading(true);
    setProgress(10);
    //Fetch random cats from the Cataas API
    const timestamp = new Date().getTime();
    setProgress(30);
    const response = await fetch(`https://cataas.com/api/cats?limit=10&skip=${Math.floor(Math.random() * 100)}&timestamp=${timestamp}`);
    setProgress(50);
    if (!response.ok) {
      throw new Error("Failed to fetch cats");
    }
    const data = await response.json();
    setProgress(90);
    setCats(data);
    setProgress(100);
    setTimeout(() => setIsLoading(false), 500); // Smooth transition after loading
  }

  const getCatImage = (id: string) => {
    return `https://cataas.com/cat/${id}`;
  }

  useEffect(() => {
    //Fetch 10 random cat images from the API
    fetchCats();
  },[]);

  const handleSwipe = (direction: string, cat: Cat) => {
    if (direction === "left") {
      setDislikeCats(prev => [...prev, cat]);
      toast("Cat disliked!");
      console.log("Disliked cat:", cat.id);
    } else if (direction === "right") {
      setLikeCats(prev => [...prev, cat]);
      toast("Cat liked!");
      console.log("Liked cat:", cat.id);
    }
  };

  const [props, api] = useSprings(cats.length, i => ({
    ...to(i),
    from: from(),
  }));

  // Create a drag binding
  const bind = useDrag(({ args: [index], active, movement: [mx], direction: [xDir], velocity: [vx] }) => {
    const trigger = vx > 0.2;
    const dir = xDir < 0 ? -1 : 1;

    if (!active && trigger) {
      gone.add(index);
      
      const cat = cats[index];
      if (dir < 0) {
        handleSwipe("left", cat);
      } else {
        handleSwipe("right", cat);
      }

      setTimeout(() => {
        setCats(prevCats => prevCats.filter((_, i) => i !== index));
      }, 300);
    }

    api.start(i => {
      if (index !== i) return;
      const isGone = gone.has(index);

      const x = isGone ? (200 + window.innerWidth) * dir : active ? mx : 0;
      const rot = mx / 100 + (isGone ? dir * 10 * vx : 0);
      const scale = active ? 1.1 : 1;

      return {
        x,
        rot,
        scale,
        delay: undefined,
        config: { friction: 50, tension: isGone ? 200 : 500 },
      };
    });
  });

  const catRender = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] w-full max-w-md p-6 rounded-xl bg-white/90 backdrop-blur-sm shadow-lg border border-primary/10">
          <div className="w-full mb-4">
            <Progress value={progress} className="h-2" />
          </div>
          
          {/* Cat silhouette loader */}
          <div className="relative w-full h-64 bg-muted/30 rounded-lg mb-4 overflow-hidden animate-pulse">
            <div className="absolute inset-0 flex items-center justify-center">
              <Cat className="h-24 w-24 text-muted-foreground/30" />
            </div>
            <div className="absolute bottom-0 w-full h-12 bg-muted/20"></div>
          </div>
          
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-primary animate-spin" />
            <p className="text-lg font-medium text-muted-foreground">Finding purrfect matches...</p>
          </div>
        </div>
      );
    }

    if (cats.length === 0) {
      return catSummary();
    }

    return (
      <div className="flex flex-col items-center gap-6">
        {props.map(({ x, y, rot, scale }, i) => (
          <animated.div
            className="absolute select-none touch-none"
            key={cats[i]?.id || i}
            style={{ x, y, touchAction: "none" }}
          >
            <animated.div
              {...bind(i)}
              style={{
                transform: interpolate([rot, scale], transform),
                touchAction: "none",
              }}
            >
              <Card className="w-[340px] sm:w-[400px] shadow-xl border-2 transition-all duration-300 border-muted hover:border-primary/20 bg-background/95 backdrop-blur-xl overflow-hidden">
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm shadow">
                      <Heart className="h-3 w-3 mr-1" /> Swipe right
                    </Badge>
                    <Badge variant="outline" className="bg-background/80 backdrop-blur-sm shadow">
                      <X className="h-3 w-3 mr-1" /> Swipe left
                    </Badge>
                  </div>
                  <CardContent className="flex justify-center items-center p-0">
                    <div className="relative w-full">
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent z-10"></div>
                      <Image
                        src={getCatImage(cats[i]?.id) || `https://placehold.co/400x300?text=Image+Not+Found`}
                        alt={`Cat ${cats[i]?.id}`}
                        className="w-full h-72 object-cover transition-transform duration-300 hover:scale-105"
                        width={400}
                        height={300}
                        unoptimized
                        priority
                      />
                    </div>
                  </CardContent>
                </div>
                
                <CardHeader className="pb-2 pt-3">
                  <CardDescription className="text-xs flex flex-wrap gap-1">
                    {cats[i]?.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </CardDescription>
                </CardHeader>
                
                <Separator />
                
                <CardFooter className="flex justify-between gap-4 py-4">
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-14 w-14 hover:bg-destructive/10 border-destructive text-destructive hover:text-destructive hover:scale-110 transition-all shadow-sm"
                    aria-label="Dislike"
                    onClick={() => {
                      gone.add(i);
                      handleSwipe("left", cats[i]);
                      // Add a feedback animation
                      document.body.classList.add('dislike-feedback');
                      setTimeout(() => document.body.classList.remove('dislike-feedback'), 300);
                      
                      api.start((j) => {
                        if (i !== j) return;
                        return {
                          x: -200 - window.innerWidth,
                          rot: -10,
                          scale: 1,
                          delay: undefined,
                          config: { friction: 50, tension: 200 },
                        };
                      });
                      setTimeout(() => {
                        setCats(prevCats => prevCats.filter((_, idx) => idx !== i));
                      }, 300);
                    }}
                  >
                    <X className="w-7 h-7" />
                  </Button>
                  
                  <div className="flex items-center">
                    <span className="text-sm text-muted-foreground mx-2">Swipe to match</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full h-14 w-14 hover:bg-primary/10 border-primary text-primary hover:text-primary hover:scale-110 transition-all shadow-sm"
                    aria-label="Like"
                    onClick={() => {
                      gone.add(i);
                      handleSwipe("right", cats[i]);
                      // Add a feedback animation
                      document.body.classList.add('like-feedback');
                      setTimeout(() => document.body.classList.remove('like-feedback'), 300);
                      
                      api.start((j) => {
                        if (i !== j) return;
                        return {
                          x: 200 + window.innerWidth,
                          rot: 10,
                          scale: 1,
                          delay: undefined,
                          config: { friction: 50, tension: 200 },
                        };
                      });
                      setTimeout(() => {
                        setCats(prevCats => prevCats.filter((_, idx) => idx !== i));
                      }, 300);
                    }}
                  >
                    <Heart className="w-7 h-7" />
                  </Button>
                </CardFooter>
              </Card>
            </animated.div>
          </animated.div>
        ))}
      </div>
    );
  };

  const catSummary = () => {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/95 backdrop-blur-md rounded-xl shadow-lg min-h-[400px] w-full max-w-md border border-primary/10">
        <div className="relative mb-6">
          <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-primary rounded-full blur opacity-30"></div>
          <div className="relative bg-white rounded-full p-4 shadow-inner">
            <Cat className="h-16 w-16 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold mb-2">Swipe Session Complete!</h2>
        <p className="text-muted-foreground mb-6 text-center">Here&apos;s a summary of your matches</p>
        
        <div className="grid grid-cols-2 gap-6 w-full max-w-xs mb-8">
          <div className="relative bg-gradient-to-br from-pink-50 to-primary/5 p-6 rounded-xl flex flex-col items-center border border-primary/20 shadow-sm">
            <Heart className="h-8 w-8 text-primary mb-2" />
            <span className="text-3xl font-bold">{likeCats.length}</span>
            <span className="text-sm text-muted-foreground">Liked</span>
          </div>
          
          <div className="stat relative bg-gradient-to-br from-red-50 to-destructive/5 p-6 rounded-xl flex flex-col items-center border border-destructive/20 shadow-sm">
            <X className="h-8 w-8 text-destructive mb-2" />
            <span className="text-3xl font-bold">{dislikeCats.length}</span>
            <span className="text-sm text-muted-foreground">Passed</span>
          </div>
        </div>
        
        <Button
          onClick={() => {
            setLikeCats([]);
            setDislikeCats([]);
            fetchCats();
            gone.clear();
            api.start(i => to(i));
          }}
          className="mt-4 group bg-gradient-to-r from-primary to-pink-600 hover:from-primary/90 hover:to-pink-500 transition-all duration-300 border-0 shadow-md"
          size="lg"
        >
          <RefreshCw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          Find more cats
        </Button>
        
        {likeCats.length > 0 && (
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Your favorite matches</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {likeCats.slice(0, 5).map((cat) => (
                <div key={cat.id} className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary shadow-sm">
                  <Image 
                    src={getCatImage(cat.id)} 
                    alt="Liked cat"
                    width={50}
                    height={50}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              ))}
              {likeCats.length > 5 && (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                  +{likeCats.length - 5}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 pattern-dots pattern-blue-500 pattern-bg-white pattern-size-2 pattern-opacity-5">
      <div className="container mx-auto px-4 py-8 flex flex-col items-center">
        <header className="mb-12 text-center">
          <div className="relative inline-block mb-4">
            <div className="absolute -inset-3 bg-gradient-to-r from-pink-500 to-primary rounded-full blur opacity-25"></div>
            <h1 className="relative text-4xl md:text-5xl font-extrabold tracking-tight mb-2 flex items-center justify-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-pink-600">
              <Cat className="h-10 w-10 text-primary" /> Purfect Match
            </h1>
          </div>
          <p className="text-muted-foreground max-w-md text-lg">
            Swipe right to like, left to pass. Find your purrfect feline match today!
          </p>
        </header>
        
        <div className="relative w-full flex justify-center min-h-[530px]">
          {catRender()}
        </div>
        
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Cat className="h-4 w-4" />
            <span>Powered by The cataas API</span>
          </div>
          <p>© 2025 Purfect Match &bull; Bringing cats and humans together</p>
        </footer>
      </div>
    </div>
  );
};

export default CatPage;