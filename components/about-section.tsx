import { Gift, Truck, Award, Heart } from 'lucide-react';

const features = [
  {
    icon: Gift,
    title: 'Produtos Selecionados',
    description: 'Cada item é cuidadosamente escolhido para garantir a melhor qualidade.',
  },
  {
    icon: Truck,
    title: 'Entrega Rápida',
    description: 'Entregamos no mesmo dia para pedidos feitos até às 14h.',
  },
  {
    icon: Award,
    title: 'Qualidade Garantida',
    description: 'Satisfação garantida ou devolvemos seu dinheiro.',
  },
  {
    icon: Heart,
    title: 'Feito com Amor',
    description: 'Cada cesta é montada com carinho e atenção aos detalhes.',
  },
];

export function AboutSection() {
  return (
    <section id="sobre" className="py-16 md:py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground">
            Por que escolher a Cestas & Carinho?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
            Há mais de 5 anos surpreendendo pessoas com cestas de qualidade
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-card p-6 rounded-2xl text-center hover:shadow-lg transition-shadow"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground text-lg mb-2">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
