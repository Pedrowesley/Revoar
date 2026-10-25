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

  await seedGuestHotel(partner.id);

  console.log("Seed concluído:");
  console.log(`  Admin:   ${admin.email} / revoar123`);
  console.log(`  Parceiro: parceiro@revoar.com.br / revoar123`);
  console.log(`  Hotel:   ${hotel.name} (${hotel.slug})`);
  console.log("  Hóspede: Pousada Atlântico (pousada-atlantico) ativa em Fortaleza");
}

async function seedGuestHotel(partnerId: string) {
  const slug = "pousada-atlantico";
  let hotel = await prisma.hotel.findUnique({
    where: { slug },
    include: { roomTypes: true },
  });
  if (!hotel) {
    hotel = await prisma.hotel.create({
      data: {
        partnerId,
        name: "Pousada Atlântico",
        slug,
        description:
          "Pousada à beira-mar em Fortaleza, com café da manhã e quartos para casal. O hóspede escolhe o quarto e a tarifa.",
        starRating: 3.0,
        addressLine: "Rua dos Tabajaras, 200",
        city: "Fortaleza",
        state: "CE",
        zipCode: "60060510",
        phone: "8533334040",
        supplierType: SupplierType.DIRECT,
        status: HotelStatus.ACTIVE,
        bookingMode: "INSTANT",
        amenities: ["POOL", "BREAKFAST_AREA", "BEACH"],
        houseRules: "Check-in a partir das 14:00. Silêncio depois das 22:00.",
        roomTypes: {
          create: [
            {
              name: "Quarto duplo",
              description: "Quarto com cama queen, ar-condicionado e banheiro privativo.",
              maxAdults: 2,
              maxChildren: 1,
              maxOccupancy: 3,
              bedConfiguration: "1 cama queen",
              amenities: ["WIFI", "AC", "TV", "PRIVATE_BATH"],
              sizeSqm: 22,
              sortOrder: 0,
              bookingMode: "INHERIT",
            },
            {
              name: "Suíte com varanda",
              description: "Suíte com cama king e varanda. A reserva deste quarto fica sob consulta.",
              maxAdults: 2,
              maxChildren: 1,
              maxOccupancy: 3,
              bedConfiguration: "1 cama king",
              amenities: ["WIFI", "AC", "TV", "BALCONY", "PRIVATE_BATH"],
              sizeSqm: 32,
              sortOrder: 1,
              bookingMode: "REQUEST",
            },
          ],
        },
      },
      include: { roomTypes: true },
    });
  }

  const existingPlans = await prisma.ratePlan.count({ where: { hotelId: hotel.id } });
  if (existingPlans > 0) return;

  const standard = hotel.roomTypes.find((room) => room.name === "Quarto duplo");
  const suite = hotel.roomTypes.find((room) => room.name === "Suíte com varanda");
  if (!standard || !suite) return;

  const flexible = await prisma.ratePlan.create({
    data: {
      hotelId: hotel.id,
      roomTypeId: standard.id,
      name: "Flexível com café",
      cancellationPolicy: "FLEXIBLE",
      mealPlan: "BREAKFAST",
      minNights: 1,
    },
  });
  const requestPlan = await prisma.ratePlan.create({
    data: {
      hotelId: hotel.id,
      roomTypeId: suite.id,
      name: "Sob consulta",
      cancellationPolicy: "MODERATE",
      mealPlan: "BREAKFAST",
      minNights: 1,
    },
  });

  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  for (let offset = 1; offset <= 40; offset += 1) {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + offset);
    const rentedOffline = offset === 12;
    await prisma.roomInventory.create({
      data: {
        roomTypeId: standard.id,
        date,
        unitsForSale: 4,
        blockedUnits: rentedOffline ? 4 : 0,
        blockReason: rentedOffline ? "RENTED_OFFLINE" : null,
      },
    });
    await prisma.dailyRate.create({ data: { ratePlanId: flexible.id, date, priceCents: 28000 } });
    await prisma.roomInventory.create({
      data: { roomTypeId: suite.id, date, unitsForSale: 2, blockedUnits: 0 },
    });
    await prisma.dailyRate.create({ data: { ratePlanId: requestPlan.id, date, priceCents: 42000 } });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
