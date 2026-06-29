import bcrypt from "bcryptjs";
import { PrismaClient, PartnerStatus, HotelStatus, SupplierType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("revoar123", 10);

  const admin = await prisma.adminUser.upsert({
    where: { email: "admin@revoar.com.br" },
    update: {},
    create: {
      email: "admin@revoar.com.br",
      passwordHash,
      name: "Admin Revoar",
      role: "SUPER_ADMIN",
    },
  });

  const partner = await prisma.partner.upsert({
    where: { cnpj: "11222333000181" },
    update: {},
    create: {
      legalName: "Hospedagens Nordeste Ltda",
      tradeName: "Nordeste Hotéis",
      cnpj: "11222333000181",
      email: "contato@nordestehoteis.com.br",
      phone: "11999998888",
      contactName: "Maria Silva",
      status: PartnerStatus.ACTIVE,
      users: {
        create: {
          email: "parceiro@revoar.com.br",
          passwordHash,
          name: "Maria Silva",
        },
      },
    },
    include: { users: true },
  });

  const hotel = await prisma.hotel.upsert({
    where: { slug: "hotel-exemplo-fortaleza" },
    update: {},
    create: {
      partnerId: partner.id,
      name: "Hotel Exemplo Fortaleza",
      slug: "hotel-exemplo-fortaleza",
      description:
        "Hotel à beira-mar em Fortaleza, ideal para famílias. Quartos amplos, piscina e café da manhã incluso.",
      starRating: 4.0,
      addressLine: "Av. Beira Mar, 1000",
      city: "Fortaleza",
      state: "CE",
      zipCode: "60165081",
      phone: "8532221000",
      supplierType: SupplierType.DIRECT,
      status: HotelStatus.DRAFT,
      roomTypes: {
        create: [
          {
            name: "Quarto Standard",
            description: "Quarto confortável com vista parcial do mar, 25m².",
            maxAdults: 2,
            maxChildren: 1,
            maxOccupancy: 3,
            bedConfiguration: "1 cama queen",
            amenities: ["WIFI", "AC", "TV", "PRIVATE_BATH"],
            sizeSqm: 25,
          },
          {
            name: "Suíte Família",
            description: "Suíte espaçosa para famílias, 40m², duas camas.",
            maxAdults: 2,
            maxChildren: 2,
            maxOccupancy: 4,
            bedConfiguration: "1 cama king + 1 sofá-cama",
            amenities: ["WIFI", "AC", "TV", "MINIBAR", "PRIVATE_BATH", "BALCONY"],
            sizeSqm: 40,
          },
        ],
      },
    },
  });

  console.log("Seed concluído:");
  console.log(`  Admin:   ${admin.email} / revoar123`);
  console.log(`  Parceiro: parceiro@revoar.com.br / revoar123`);
  console.log(`  Hotel:   ${hotel.name} (${hotel.slug})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
